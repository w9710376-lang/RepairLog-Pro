import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Job, JobStatus } from '../types';
import { ArrowLeft, Plus, Trash2, Camera, X } from 'lucide-react';
import { compressImage } from '../lib/imageUtils';
import { format } from 'date-fns';

export default function JobEdit() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    equipment: '',
    location: '',
    status: 'pending' as JobStatus,
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    const fetchJob = async () => {
      if (!id || !profile) return;
      try {
        const docRef = doc(db, 'jobs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Job;
          // Check permissions (only admin or the technician who created the job can edit)
          if (profile.role !== 'admin' && data.technicianId !== profile.id) {
            navigate('/jobs');
            return;
          }
          setFormData({
            title: data.title,
            description: data.description,
            equipment: data.equipment,
            location: data.location,
            status: data.status,
            date: format(data.date || Date.now(), 'yyyy-MM-dd'),
          });
          setPhotos(data.photos || []);
        } else {
          navigate('/jobs');
        }
      } catch (error) {
        console.error("Error fetching job", error);
      } finally {
        setFetching(false);
      }
    };
    fetchJob();
  }, [id, navigate, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const base64Str = await compressImage(file);
      setPhotos(prev => [...prev, base64Str]);
    } catch (error) {
      console.error("Error compressing image:", error);
      alert("Failed to process image.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !id) return;
    setLoading(true);

    try {
      const parsedDate = new Date(formData.date);
      // keep current time logic for the edited date
      const now = new Date();
      parsedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const jobRef = doc(db, 'jobs', id);
      await updateDoc(jobRef, {
        title: formData.title,
        description: formData.description,
        equipment: formData.equipment,
        location: formData.location,
        status: formData.status,
        date: parsedDate.getTime(),
        photos: photos,
        updatedAt: Date.now(),
      });
      navigate(`/jobs/${id}`);
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update job.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading job data...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/jobs/${id}`} className="p-2 bg-slate-100 hover:bg-slate-200 rounded transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Job</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Job Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-100 border-none rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label htmlFor="equipment" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Equipment / Machine</label>
              <input
                type="text"
                id="equipment"
                name="equipment"
                required
                value={formData.equipment}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-100 border-none rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location / Site</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date Logged</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Description</label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-100 border-none rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-100 border-none rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Job Photos</label>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {photos.map((url, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square bg-slate-100 rounded border border-slate-200 flex items-center justify-center overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={`Job ${index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemovePhoto(index); }}
                        className="absolute top-1.5 right-1.5 bg-white/90 p-1.5 rounded text-slate-600 hover:bg-red-50 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  id="camera-upload-edit"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="camera-upload-edit"
                  className={`bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded hover:bg-slate-100 cursor-pointer flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors w-full border-dashed ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Camera className="w-4 h-4" /> 
                  {uploadingImage ? 'Processing Image...' : 'Take or Upload Photo'}
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded font-bold uppercase tracking-wider text-sm shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/70 hover:text-white p-2 transition-colors rounded-full hover:bg-white/10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>
          <img 
            src={selectedImage} 
            alt="Expanded view" 
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
