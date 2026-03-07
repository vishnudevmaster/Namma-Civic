import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function generateComplaintId(id: number | string): string {
    const year = new Date().getFullYear();
    return `NC-${year}-${String(id).padStart(5, '0')}`;
}

const seeds = [
    { type: 'Pothole', location: 'Indiranagar 100ft Road', ward: 'Indiranagar', description: 'Massive pothole near Metro Pillar 47 causing traffic jams and two-wheeler accidents. At least 3 feet wide.', status: 'in_progress', user_id: 'user1', reporter_name: 'Teena Sharma', upvotes: 24, created_at: '2026-03-01 09:15:00' },
    { type: 'Garbage', location: 'Koramangala 4th Block, Near Sony Signal', ward: 'Koramangala', description: 'Garbage not collected for 5 days. Entire sidewalk is blocked with waste. Stray dogs tearing through bags.', status: 'submitted', user_id: 'user2', reporter_name: 'Ravi Kumar', upvotes: 18, created_at: '2026-03-03 14:30:00' },
    { type: 'Streetlight', location: 'Malleswaram 8th Cross, Near Mantri Mall', ward: 'Malleswaram', description: 'Row of 4 streetlights broken near the park. Area is completely dark after 7pm. Unsafe for pedestrians.', status: 'resolved', user_id: 'user3', reporter_name: 'Shilpa Gowda', upvotes: 31, created_at: '2026-02-25 18:45:00' },
    { type: 'Water', location: 'Whitefield Main Road, ITPL Side', ward: 'Whitefield', description: 'No water supply since yesterday morning. BWSSB tanker also not arrived. 200+ families affected in our apartment complex.', status: 'assigned', user_id: 'user1', reporter_name: 'Teena Sharma', upvotes: 42, created_at: '2026-03-05 07:00:00' },
    { type: 'Drainage', location: 'Jayanagar 4th Block, Near Cool Joint', ward: 'Jayanagar', description: 'Open drain overflowing onto the road. Sewage water entering nearby shops. Health hazard during rainy season.', status: 'under_review', user_id: 'user4', reporter_name: 'Anand Rao', upvotes: 15, created_at: '2026-03-04 11:20:00' },
    { type: 'Traffic', location: 'Silk Board Junction', ward: 'BTM Layout', description: 'Traffic signal timing is wrong — 90 seconds for smaller road, only 30 seconds for main road. Creating 2km tailback daily.', status: 'submitted', user_id: 'user5', reporter_name: 'Priya Nair', upvotes: 56, created_at: '2026-03-06 08:30:00' },
    { type: 'Pothole', location: 'Outer Ring Road, Near Marathahalli Bridge', ward: 'Marathahalli', description: 'Series of potholes on service road after recent rain. Multiple accidents reported. Autorickshaws refusing to come this route.', status: 'in_progress', user_id: 'user2', reporter_name: 'Ravi Kumar', upvotes: 38, created_at: '2026-03-02 16:00:00' },
    { type: 'Garbage', location: 'HSR Layout Sector 2, 27th Main', ward: 'HSR Layout', description: 'Vacant plot being used as illegal dump yard. Construction debris and household waste piling up. Mosquito breeding ground.', status: 'assigned', user_id: 'user6', reporter_name: 'Meera Devi', upvotes: 22, created_at: '2026-03-03 10:00:00' },
    { type: 'Streetlight', location: 'Cubbon Park, Near Bandstand', ward: 'Shivajinagar', description: 'Half of the pathway lights inside Cubbon Park not working. Evening walkers and joggers feel unsafe.', status: 'submitted', user_id: 'user3', reporter_name: 'Shilpa Gowda', upvotes: 29, created_at: '2026-03-06 19:00:00' },
    { type: 'Water', location: 'Rajajinagar 2nd Block, Near Navrang Theatre', ward: 'Rajajinagar', description: 'Water pipeline burst at the junction. Clean water wasting for 2 days. Called BWSSB but no response.', status: 'resolved', user_id: 'user7', reporter_name: 'Suresh Babu', upvotes: 35, created_at: '2026-02-28 12:00:00' },
    { type: 'Other', location: 'MG Road, Near Brigade Road Junction', ward: 'Shivajinagar', description: 'Footpath tiles completely broken and uneven. Senior citizens struggle to walk safely. Needs immediate re-tiling.', status: 'under_review', user_id: 'user4', reporter_name: 'Anand Rao', upvotes: 12, created_at: '2026-03-05 15:30:00' },
    { type: 'Drainage', location: 'Yelahanka New Town, Near Lake', ward: 'Yelahanka', description: 'Storm water drain blocked with construction debris. Entire stretch floods even with light rain causing waterlogging.', status: 'in_progress', user_id: 'user8', reporter_name: 'Lakshmi Narasimha', upvotes: 19, created_at: '2026-03-01 13:45:00' },
];

async function seed() {
    console.log('Clearing old data...');
    // We cannot easily delete all rows without an id column condition in Supabase via JS sometimes, 
    // so we'll just insert new ones for now if doing a fresh seed.

    console.log('Seeding new data...');

    for (const s of seeds) {
        // 1. Insert seed with temporary ID
        const { data: inserted, error: insertError } = await supabase
            .from('complaints')
            .insert([{
                complaint_id: `TEMP-${Math.random()}`,
                type: s.type,
                location: s.location,
                ward: s.ward,
                description: s.description,
                user_id: s.user_id,
                reporter_name: s.reporter_name,
                status: s.status,
                upvotes: s.upvotes,
                created_at: s.created_at,
                admin_notes: [],
                upvoted_by: []
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting:', insertError);
            continue;
        }

        // 2. Add real complaint ID
        const complaintId = generateComplaintId(inserted.id);
        await supabase
            .from('complaints')
            .update({ complaint_id: complaintId })
            .eq('id', inserted.id);
    }

    console.log('Done seeding!');
}

seed();
