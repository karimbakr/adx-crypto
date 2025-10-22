import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 🔹 استخدام Environment Variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const balanceEl = document.getElementById('balance');
const adsCountEl = document.getElementById('adsCount');
const adsRemainingPill = document.getElementById('adsRemainingPill');
const progressBar = document.getElementById('progressBar');
const watchBtn = document.getElementById('watchBtn');
const watchBtnSpinner = document.getElementById('watchBtnSpinner');
const watchBtnText = document.getElementById('watchBtnText');

const DAILY_LIMIT = 100;
let currentBalance = 0;
let todaysCount = 0;
let isProcessingAd = false;

// الحصول على التاريخ الحالي YYYY-MM-DD
function formatDateYMD(d){
  return d.toISOString().slice(0,10);
}
const todayYMD = formatDateYMD(new Date());

// إعداد المستخدم (تلقائي)
let userId = 'guest-' + Date.now();

// إنشاء حساب المستخدم إذا لم يوجد
async function setupUser(){
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error || !data){
    // إنشاء مستخدم جديد
    const { error: insertErr } = await supabase.from('users').insert({
      id: userId,
      balance: 0,
      daily: { date: todayYMD, count: 0 },
      createdAt: Date.now()
    });
    if (insertErr) console.error(insertErr);
    currentBalance = 0;
    todaysCount = 0;
  } else {
    currentBalance = parseFloat(data.balance || 0);
    if (data.daily?.date === todayYMD) todaysCount = parseInt(data.daily.count || 0);
    else {
      todaysCount = 0;
      await supabase.from('users').update({ daily: { date: todayYMD, count: 0 }}).eq('id', userId);
    }
  }
  refreshUI();
}

// تحديث واجهة المستخدم
function refreshUI(){
  balanceEl.innerText = `${currentBalance.toFixed(4)} USDT`;
  adsCountEl.innerText = `${todaysCount}/${DAILY_LIMIT}`;
  const remaining = Math.max(0, DAILY_LIMIT - todaysCount);
  adsRemainingPill.innerText = `${remaining} left`;
  const percent = Math.min(100, Math.round((todaysCount/DAILY_LIMIT)*100));
  progressBar.style.width = percent + '%';

  if (todaysCount >= DAILY_LIMIT) disableWatchButton(true, "You've reached today's limit");
  else disableWatchButton(false, '🎬 Watch Ad & Earn 0.0002');
}

function disableWatchButton(disable, text){
  if (disable){
    watchBtn.setAttribute('disabled','true');
    watchBtn.classList.add('opacity-60');
    watchBtnText.innerText = text;
  } else {
    watchBtn.removeAttribute('disabled');
    watchBtn.classList.remove('opacity-60');
    watchBtnText.innerText = text;
  }
}

// إضافة رصيد بعد مشاهدة إعلان
async function creditReward(amount){
  currentBalance += amount;
  todaysCount++;
  await supabase.from('users').update({
    balance: currentBalance,
    daily: { date: todayYMD, count: todaysCount }
  }).eq('id', userId);
  refreshUI();
}

// محاكاة مشاهدة الإعلان
watchBtn.addEventListener('click', async ()=>{
  if (isProcessingAd || todaysCount >= DAILY_LIMIT) return;
  isProcessingAd = true;
  watchBtnSpinner.classList.remove('hidden');

  try {
    // 🔹 هنا تقدر تستبدل بالـ Monetag SDK أو أي نظام إعلان
    await new Promise(res=>setTimeout(res, 1500)); // Simulate ad
    await creditReward(0.0002);
  } catch(e){
    console.error(e);
  } finally {
    watchBtnSpinner.classList.add('hidden');
    isProcessingAd = false;
  }
});

// البدء
setupUser();
