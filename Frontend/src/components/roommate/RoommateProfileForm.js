import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import roommateService from '../../services/roommateService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import './RoommateProfileForm.css';

const INTEREST_OPTIONS = [
    'Reading', 'Music', 'Movies', 'Gaming', 'Sports', 'Cooking',
    'Traveling', 'Photography', 'Art', 'Coding', 'Fitness', 'Yoga',
    'Dancing', 'Writing', 'Gardening', 'Pets'
];

const RoommateProfileForm = ({ existingProfile, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        city: '',
        area: '',
        budgetMin: '',
        budgetMax: '',
        expectedMoveInDate: '',
        duration: 'long-term',
        studentStatus: 'student',
        college: '',
        organization: '',
        year: '',
        batch: '',
        genderPreference: 'any',
        interests: [],
        lifestyle: {
            sleepSchedule: 'flexible',
            foodPreference: 'both',
            smoking: 'no',
            guests: 'rare',
            cleanlinessLevel: 'medium'
        }
    });

    useEffect(() => {
        if (existingProfile) {
            setFormData({
                ...existingProfile,
                expectedMoveInDate: existingProfile.expectedMoveInDate?.split('T')[0] || ''
            });
        }
    }, [existingProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('lifestyle.')) {
            const lifestyleField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                lifestyle: {
                    ...prev.lifestyle,
                    [lifestyleField]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleInterest = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.city || !formData.budgetMin || !formData.budgetMax || !formData.expectedMoveInDate) {
                toast.error('Please fill all required fields');
                return false;
            }
            if (parseInt(formData.budgetMax) < parseInt(formData.budgetMin)) {
                toast.error('Max budget must be greater than min budget');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await roommateService.createOrUpdateProfile(formData);
            toast.success(result.message || 'Profile saved successfully!');
            if (onSuccess) onSuccess(result.profile);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="roommate-profile-form">
            <div className="form-progress">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Basic Info</div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Lifestyle</div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Interests</div>
            </div>

            <form onSubmit={handleSubmit}>
                {step === 1 && (
                    <motion.div
                        className="form-step"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h3>Basic Information</h3>

                        <div className="form-grid">
                            <Input
                                label="City *"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="e.g., Mumbai, Bangalore"
                                required
                            />

                            <Input
                                label="Area/Locality"
                                name="area"
                                value={formData.area}
                                onChange={handleChange}
                                placeholder="e.g., Andheri, Koramangala"
                            />

                            <Input
                                label="Min Budget (₹/month) *"
                                type="number"
                                name="budgetMin"
                                value={formData.budgetMin}
                                onChange={handleChange}
                                required
                            />

                            <Input
                                label="Max Budget (₹/month) *"
                                type="number"
                                name="budgetMax"
                                value={formData.budgetMax}
                                onChange={handleChange}
                                required
                            />

                            <Input
                                label="Expected Move-in Date *"
                                type="date"
                                name="expectedMoveInDate"
                                value={formData.expectedMoveInDate}
                                onChange={handleChange}
                                required
                            />

                            <div className="form-field">
                                <label>Duration *</label>
                                <select name="duration" value={formData.duration} onChange={handleChange}>
                                    <option value="short-term">Short-term (≤6 months)</option>
                                    <option value="long-term">Long-term ({'>'}6 months)</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Status *</label>
                                <select name="studentStatus" value={formData.studentStatus} onChange={handleChange}>
                                    <option value="student">Student</option>
                                    <option value="intern">Intern</option>
                                    <option value="working">Working Professional</option>
                                </select>
                            </div>

                            {formData.studentStatus === 'student' && (
                                <>
                                    <Input
                                        label="College/University"
                                        name="college"
                                        value={formData.college}
                                        onChange={handleChange}
                                        placeholder="e.g., IIT Bombay"
                                    />

                                    <Input
                                        label="Year"
                                        type="number"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        placeholder="e.g., 2, 3, 4"
                                        min="1"
                                        max="6"
                                    />

                                    <Input
                                        label="Batch"
                                        name="batch"
                                        value={formData.batch}
                                        onChange={handleChange}
                                        placeholder="e.g., 2022-2026"
                                    />
                                </>
                            )}

                            {(formData.studentStatus === 'intern' || formData.studentStatus === 'working') && (
                                <Input
                                    label="Organization/Company"
                                    name="organization"
                                    value={formData.organization}
                                    onChange={handleChange}
                                    placeholder="e.g., Google, Microsoft"
                                />
                            )}

                            <div className="form-field">
                                <label>Gender Preference</label>
                                <select name="genderPreference" value={formData.genderPreference} onChange={handleChange}>
                                    <option value="any">Any</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="non-binary">Non-binary</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button type="button" onClick={handleNext} variant="primary">
                                Next →
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        className="form-step"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h3>Lifestyle Preferences</h3>

                        <div className="lifestyle-grid">
                            <div className="form-field">
                                <label>Sleep Schedule *</label>
                                <select name="lifestyle.sleepSchedule" value={formData.lifestyle.sleepSchedule} onChange={handleChange}>
                                    <option value="early">Early Bird (before 11 PM)</option>
                                    <option value="late">Night Owl (after 12 AM)</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Food Preference *</label>
                                <select name="lifestyle.foodPreference" value={formData.lifestyle.foodPreference} onChange={handleChange}>
                                    <option value="veg">Vegetarian</option>
                                    <option value="non-veg">Non-Vegetarian</option>
                                    <option value="both">Both/Flexible</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Smoking *</label>
                                <select name="lifestyle.smoking" value={formData.lifestyle.smoking} onChange={handleChange}>
                                    <option value="no">No</option>
                                    <option value="occasional">Occasional</option>
                                    <option value="yes">Yes</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Guest Frequency *</label>
                                <select name="lifestyle.guests" value={formData.lifestyle.guests} onChange={handleChange}>
                                    <option value="rare">Rarely</option>
                                    <option value="sometimes">Sometimes</option>
                                    <option value="frequent">Frequently</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Cleanliness Level *</label>
                                <select name="lifestyle.cleanlinessLevel" value={formData.lifestyle.cleanlinessLevel} onChange={handleChange}>
                                    <option value="low">Relaxed</option>
                                    <option value="medium">Moderate</option>
                                    <option value="high">Very Clean</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button type="button" onClick={handleBack} variant="secondary">
                                ← Back
                            </Button>
                            <Button type="button" onClick={handleNext} variant="primary">
                                Next →
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        className="form-step"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h3>Interests & Hobbies</h3>
                        <p className="step-description">Select interests you'd like to share with your roommate</p>

                        <div className="interests-grid">
                            {INTEREST_OPTIONS.map(interest => (
                                <div
                                    key={interest}
                                    className={`interest-tag ${formData.interests.includes(interest) ? 'selected' : ''}`}
                                    onClick={() => toggleInterest(interest)}
                                >
                                    {interest}
                                </div>
                            ))}
                        </div>

                        <div className="form-actions">
                            <Button type="button" onClick={handleBack} variant="secondary">
                                ← Back
                            </Button>
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Saving...' : existingProfile ? 'Update Profile' : 'Create Profile'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </form>
        </div>
    );
};

export default RoommateProfileForm;
