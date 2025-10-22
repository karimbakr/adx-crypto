import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { table, data } = req.body;
    const { error } = await supabase.from(table).insert(data);
    if (error) return res.status(400).json({ error });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const { table } = req.query;
    const { data, error } = await supabase.from(table).select('*');
    if (error) return res.status(400).json({ error });
    return res.status(200).json(data);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
