import { useState, useEffect } from 'react';
import { supabase } from './supbaseClient';
import './auth.css';

function Auth({ onLogin }) {
  const [pin, setPin] = useState("");

  // PIN 4 haneye ulaştığında otomatik kontrol et
  useEffect(() => {
    if (pin.length === 4) {
      handleLogin();
    }
  }, [pin]);

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from('personel')
      .select('*')
      .eq('sifre', pin)
      .single();

    if (data) {
      onLogin(data);
    } else {
      alert("Hatalı PIN!");
      setPin("");
    }
  };

  const tusBasildi = (rakam) => {
    if (pin.length < 4) {
      setPin(prev => prev + rakam);
    }
  };

  const sil = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">🔓</div>
        <h1>Giriş Yap</h1>
        
        {/* Şifre Noktaları */}
        <div className="pin-display">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`dot ${pin.length > i ? 'active' : ''}`}></div>
          ))}
        </div>

        {/* NUMPAD (Sayı Tuş Takımı) */}
        <div className="numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => tusBasildi(num.toString())}>{num}</button>
          ))}
          <button className="clear" onClick={sil}>⌫</button>
          <button onClick={() => tusBasildi("0")}>0</button>
          <button className="enter" onClick={handleLogin}>✓</button>
        </div>
      </div>
    </div>
  );
}

export default Auth;