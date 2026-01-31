import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// api not needed here; token handled via querystring

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('staysafe-token', token);
      // Optionally, fetch user and set auth context — simple redirect for now
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{ padding: 40 }}>
      <h3>Signing you in...</h3>
    </div>
  );
};

export default GoogleCallback;
