import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import phoneService from '../services/phoneService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get('/user/me');
        setUser(res.data);
        setForm({ name: res.data.name || '', phone: res.data.phone || '' });
      } catch (e) {
        console.error(e);
      }
    };
    fetchMe();
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const saveProfile = async () => {
    try {
      const res = await api.put('/user/me', form);
      toast.success('Profile updated');
      setUser(res.user);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update profile');
    }
  };

  const requestOtp = async () => {
    if (!form.phone) return toast.error('Enter phone number');
    setIsRequesting(true);
    try {
      await phoneService.requestOtp(form.phone);
      toast.success('OTP sent (mock)');
    } catch (e) {
      console.error(e);
      toast.error('Failed to send OTP');
    } finally { setIsRequesting(false); }
  };

  const verifyOtp = async () => {
    if (!form.phone || !otp) return toast.error('Provide phone and OTP');
    try {
      await phoneService.verifyOtp(form.phone, otp);
      toast.success('Phone verified');
      // refresh
      const res = await api.get('/user/me');
      setUser(res.data);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'OTP verification failed');
    }
  };

  if (!user) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div className="page" style={{ padding: 20 }}>
      <h2>My Profile</h2>
      <div style={{ maxWidth: 560 }}>
        <Input label="Name" name="name" value={form.name} onChange={handleChange} />
        <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button variant="primary" onClick={saveProfile}>Save</Button>
          <Button variant="outline" onClick={requestOtp} isLoading={isRequesting}>Request OTP</Button>
        </div>

        <div style={{ marginTop: 12 }}>
          <Input label="OTP" name="otp" value={otp} onChange={e => setOtp(e.target.value)} />
          <div style={{ marginTop: 8 }}>
            <Button onClick={verifyOtp}>Verify OTP</Button>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <strong>Phone verified:</strong> {user.phoneVerified ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
