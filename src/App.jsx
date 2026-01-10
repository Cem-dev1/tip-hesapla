import { useState, useEffect } from 'react'
import { supabase } from './supbaseClient' // İsmi projedekiyle aynı mı kontrol et (supbaseClient vs supabaseClient)
import Auth from './auth.jsx'
import './App.css'

function App() {
  const [user, setUser] = useState(null);
  const [haftaBasi, setHaftaBasi] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHavuzOpen, setIsHavuzOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [tutar, setTutar] = useState("");
  
  const [tipler, setTipler] = useState({});
  const [personeller, setPersoneller] = useState([]);
  const [haftalikToplam, setHaftalikToplam] = useState(0);
  const [mutfakTutari, setMutfakTutari] = useState(0);

  const gunIsimleri = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  // Sayfa yüklendiğinde ve hafta değiştiğinde verileri çek
  useEffect(() => {
    if (user) {
      veriGetir();
      hesaplaVeGetir();
    }
  }, [haftaBasi, user]);

  const gunleriGetir = () => {
    const gunler = [];
    const baslangic = new Date(haftaBasi);
    const fark = baslangic.getDay() === 0 ? -6 : 1 - baslangic.getDay();
    baslangic.setDate(baslangic.getDate() + fark);
    for (let i = 0; i < 7; i++) {
      const yeniGun = new Date(baslangic);
      yeniGun.setDate(baslangic.getDate() + i);
      gunler.push(yeniGun);
    }
    return gunler;
  };

  const veriGetir = async () => {
    const gunler = gunleriGetir();
    const ilk = gunler[0].toISOString().split('T')[0];
    const son = gunler[6].toISOString().split('T')[0];

    const { data } = await supabase
      .from('gunluk_tip')
      .select('tarih, toplam_tutar')
      .gte('tarih', ilk)
      .lte('tarih', son);

    if (data) {
      const obj = {};
      let toplam = 0;
      data.forEach(d => {
        obj[d.tarih] = d.toplam_tutar;
        toplam += d.toplam_tutar;
      });
      setTipler(obj);
      setHaftalikToplam(toplam);
    }
  };

  const hesaplaVeGetir = async () => {
    const gunler = gunleriGetir();
    const ilkGun = gunler[0].toISOString().split('T')[0];
    const sonGun = gunler[6].toISOString().split('T')[0];

    const { data: haftaVerisi } = await supabase
      .from('gunluk_tip')
      .select('toplam_tutar')
      .gte('tarih', ilkGun)
      .lte('tarih', sonGun);

    const { data: pVerisi } = await supabase.from('personel').select('*');

    if (haftaVerisi && pVerisi) {
      const oHaftaninToplami = haftaVerisi.reduce((acc, curr) => acc + curr.toplam_tutar, 0);
      const mPayi = oHaftaninToplami * 0.20;
      const kalan = oHaftaninToplami - mPayi;

      const toplamPuan = pVerisi.reduce((acc, curr) => acc + (curr.toplam_puan || 0), 0);
      const birPuanDegeri = toplamPuan > 0 ? kalan / toplamPuan : 0;

      const hesapli = pVerisi.map(p => ({
        ...p,
        alacak: (p.toplam_puan * birPuanDegeri).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
      }));

      setHaftalikToplam(oHaftaninToplami);
      setMutfakTutari(mPayi.toFixed(0));
      setPersoneller(hesapli);
    }
  };

  const tipKaydet = async () => {
    if (!tutar || !selectedDate) return;
    const tarihString = selectedDate.toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('gunluk_tip')
      .upsert({ tarih: tarihString, toplam_tutar: parseFloat(tutar) }, { onConflict: 'tarih' });

    if (!error) {
      setIsModalOpen(false);
      setTutar("");
      await veriGetir();
      await hesaplaVeGetir();
    }
  };

  // Auth Kontrolü (User yoksa Auth ekranını render et)
  if (!user) {
    return <Auth onLogin={(userData) => setUser(userData)} />;
  }

  // User varsa Ana Uygulamayı render et
  return (
    <div className="container">
      <div className="header">
        <button onClick={() => setHaftaBasi(new Date(new Date(haftaBasi).setDate(haftaBasi.getDate() - 7)))}>{"<"}</button>
        <h2>{haftaBasi.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => setHaftaBasi(new Date(new Date(haftaBasi).setDate(haftaBasi.getDate() + 7)))}>{">"}</button>
      </div>

      <div className="grid-takvim">
        {gunleriGetir().map((gun, index) => {
          const tKey = gun.toISOString().split('T')[0];
          return (
            <div key={index} className="gun-kutu" onClick={() => { 
              setSelectedDate(gun); 
              setTutar(tipler[tKey] || ""); // Mevcut tutarı otomatik doldur
              setIsModalOpen(true); 
            }}>
              <span className="gun-adi">{gunIsimleri[index]}</span>
              <span className="gun-sayi">{gun.getDate()}</span>
              {tipler[tKey] ? <span className="gun-tutar">{tipler[tKey]} TL</span> : <span className="gun-bos">-</span>}
            </div>
          );
        })}
      </div>

      <div className="footer-action">
        <button className="havuz-ac-btn" onClick={() => { hesaplaVeGetir(); setIsHavuzOpen(true); }}>
          📊 Dağıtım Raporu
        </button>
      </div>
      <footer className="user-footer">
        <button className="logout-btn" onClick={() => setUser(null)}>
          <span className="icon">🚪</span> Çıkış
        </button>
        <div className="user-info">
          <span className="user-name">{user?.isim}</span>
          <div className="status-dot"></div>
        </div>
      </footer>
      {/* TIP MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-icerik" onClick={e => e.stopPropagation()}>
            <h3>{selectedDate?.toLocaleDateString('tr-TR')}</h3>
            <input type="number" inputMode="numeric" value={tutar} onChange={e => setTutar(e.target.value)} autoFocus />
            <div className="modal-butonlar">
              <button className="kaydet" onClick={tipKaydet}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* HAVUZ MODAL */}
      {isHavuzOpen && (
        <div className="modal-overlay" onClick={() => setIsHavuzOpen(false)}>
          <div className="modal-icerik havuz-modal" onClick={e => e.stopPropagation()}>
            <div className="handle"></div>
            <h3>Haftalık Dağıtım</h3>
            <span className="tarih-araligi-label">
              {gunleriGetir()[0].toLocaleDateString('tr-TR', {day:'numeric', month:'short'})} - {gunleriGetir()[6].toLocaleDateString('tr-TR', {day:'numeric', month:'short'})}
            </span>
            <div className="havuz-ozet-grid">
               <div className="ozet-kart"><span>Toplam</span><p>{haftalikToplam} TL</p></div>
               <div className="ozet-kart mutfak"><span>Mutfak %20</span><p>{mutfakTutari} TL</p></div>
            </div>
            <div className="personel-listesi-scroll">
              {personeller.map(p => (
                <div key={p.id} className="personel-kart">
                  <span>{p.isim} ({p.toplam_puan}P)</span>
                  <strong>{p.alacak} TL</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;