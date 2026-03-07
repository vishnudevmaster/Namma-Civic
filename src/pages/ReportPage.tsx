import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, MapPin, Mic, Send, Loader2, CheckCircle2, Navigation, Upload, ImageIcon } from 'lucide-react';
import PlacesAutocomplete from '../components/PlacesAutocomplete';

const CATEGORIES = ['Pothole', 'Garbage', 'Water', 'Streetlight', 'Drainage', 'Traffic', 'Other'];

const STEPS = [
  { label: 'Category', icon: '📋' },
  { label: 'Location', icon: '📍' },
  { label: 'Details', icon: '📝' },
  { label: 'Photo', icon: '📷' },
  { label: 'Submit', icon: '✅' },
];

export default function ReportPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'Pothole';

  const [step, setStep] = useState(0);
  const [type, setType] = useState(initialType);
  const [location, setLocation] = useState('');
  const [ward, setWard] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });
      setLocation(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      setWard('Auto-detected');
    } catch {
      alert('Could not detect location. Please enter manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const startRecording = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Voice recognition is not supported in this browser. Please type your description.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;
      finalTranscriptRef.current = description ? description + (description.endsWith(' ') ? '' : ' ') : '';

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (currentFinal) {
          finalTranscriptRef.current += currentFinal;
        }

        const newText = (finalTranscriptRef.current + currentInterim).slice(0, 500);
        setDescription(newText);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions.');
        }
        stopRecording();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting voice recognition:', err);
      alert('Could not start voice recognition.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalPhotoUrl = '';

      // Upload photo to Cloudinary if one was selected
      if (photoUrl) {
        setUploadProgress('Uploading photo...');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: photoUrl }),
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.error || 'Photo upload failed');
        }
        const uploadData = await uploadRes.json();
        finalPhotoUrl = uploadData.url;
      }

      setUploadProgress('Submitting complaint...');
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          location,
          ward,
          description,
          photo_url: finalPhotoUrl,
          user_id: 'user_123',
          reporter_name: reporterName || 'Anonymous',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setComplaintId(data.complaint_id);
        setSubmitted(true);
      } else {
        alert('Failed to submit complaint.');
      }
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to submit complaint.'));
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!type;
      case 1: return !!location;
      case 2: return !!description;
      case 3: return true; // photo is optional
      case 4: return true;
      default: return false;
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-16 pb-28 md:pb-16"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-stone-900 mb-3">Complaint Submitted!</h2>
        <p className="text-stone-600 mb-2">Your complaint has been registered successfully.</p>
        <div className="bg-emerald-50 rounded-2xl p-4 mb-6 inline-block">
          <p className="text-sm text-emerald-700 font-medium">Your Complaint ID</p>
          <p className="text-2xl font-mono font-bold text-emerald-800 mt-1">{complaintId}</p>
        </div>
        <p className="text-sm text-stone-500 mb-8">Save this ID to track your complaint status.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <a href="/my-complaints" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition">
            Track Status
          </a>
          <button
            onClick={() => { setSubmitted(false); setStep(0); setType('Pothole'); setLocation(''); setWard(''); setDescription(''); setPhotoUrl(''); setReporterName(''); }}
            className="bg-white text-stone-700 px-6 py-3 rounded-xl font-medium border border-stone-200 hover:border-stone-300 transition"
          >
            Report Another
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto pb-28 md:pb-8"
    >
      {/* Step Progress Indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center">
              <div
                className={`step-dot ${i <= step ? 'bg-emerald-600 text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}
              >
                {i < step ? '✓' : s.icon}
              </div>
              <span className={`text-[10px] mt-1.5 font-medium ${i <= step ? 'text-emerald-600' : 'text-stone-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line mx-1 ${i < step ? 'bg-emerald-500' : 'bg-stone-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-stone-900 mb-6">
          {STEPS[step].icon} {STEPS[step].label}
        </h2>

        {/* Step 0: Category */}
        {step === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setType(cat)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${type === cat
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-stone-100 bg-stone-50 hover:border-stone-200'
                  }`}
              >
                <span className="text-sm font-semibold text-stone-900">{cat}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-4">
            <PlacesAutocomplete
              value={location}
              onChange={setLocation}
              onPlaceSelect={(place) => {
                setLocation(place.address);
                // Extract ward/area from the address if possible
                const parts = place.address.split(',');
                if (parts.length >= 2) {
                  setWard(parts[1].trim());
                }
              }}
              placeholder="Search for a location in Bengaluru..."
            />
            <button
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-700 py-3 rounded-xl font-medium hover:bg-stone-200 transition disabled:opacity-60"
            >
              {isDetectingLocation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
              {isDetectingLocation ? 'Detecting...' : 'Auto-detect My Location'}
            </button>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Ward (optional)</label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="e.g., Indiranagar"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={5}
                maxLength={500}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute bottom-4 right-4 p-2.5 rounded-full transition-colors ${isRecording
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                  }`}
                title="Voice to text"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-stone-400 text-right">{description.length}/500 characters</p>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Your Name (optional)</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Anonymous"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 3: Photo */}
        {step === 3 && (
          <div className="space-y-4">
            {photoUrl ? (
              <div className="border-2 border-emerald-200 rounded-2xl p-4 bg-emerald-50/50 relative overflow-hidden">
                <img src={photoUrl} alt="Preview" className="w-full h-56 object-cover rounded-xl" />
                <div className="flex justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="bg-white px-5 py-2.5 rounded-xl text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 transition border border-stone-200"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Take Photo with Camera */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer min-h-[180px] group"
                >
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <Camera className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-stone-800 block">Take Photo</span>
                    <span className="text-xs text-stone-400 mt-0.5 block">Open device camera</span>
                  </div>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {/* Upload from Gallery */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer min-h-[180px] group"
                >
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <ImageIcon className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-stone-800 block">Upload Photo</span>
                    <span className="text-xs text-stone-400 mt-0.5 block">Choose from gallery</span>
                  </div>
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            )}
            <p className="text-xs text-stone-400 text-center">Photo evidence is optional but helps speed up resolution • Max 5MB • JPG/PNG</p>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-stone-50 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Category</span>
                <span className="text-sm font-semibold text-stone-900">{type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Location</span>
                <span className="text-sm font-semibold text-stone-900 text-right max-w-[200px]">{location}</span>
              </div>
              {ward && (
                <div className="flex justify-between">
                  <span className="text-sm text-stone-500">Ward</span>
                  <span className="text-sm font-semibold text-stone-900">{ward}</span>
                </div>
              )}
              <div className="border-t border-stone-200 pt-3">
                <span className="text-sm text-stone-500 block mb-1">Description</span>
                <p className="text-sm text-stone-700">{description}</p>
              </div>
              {photoUrl && (
                <div className="border-t border-stone-200 pt-3">
                  <span className="text-sm text-stone-500 block mb-2">Photo</span>
                  <img src={photoUrl} alt="Evidence" className="w-full h-40 object-cover rounded-xl" />
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Reporter</span>
                <span className="text-sm font-semibold text-stone-900">{reporterName || 'Anonymous'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-stone-100 text-stone-700 rounded-xl py-3.5 font-semibold hover:bg-stone-200 transition"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 bg-emerald-600 text-white rounded-xl py-3.5 font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl py-3.5 font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isSubmitting && uploadProgress ? uploadProgress : 'Submit Complaint'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
