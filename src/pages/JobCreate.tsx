import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Job, JobStatus, JobAttachment } from '../types';
import { ArrowLeft, Plus, Trash2, Camera, X, Paperclip, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { compressImage } from '../lib/imageUtils';
import { format } from 'date-fns';

import { logJobHistory } from '../lib/history';

export default function JobCreate() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<JobAttachment[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    equipment: '',
    location: '',
    technicianName: profile?.name || '',
    status: 'pending' as JobStatus,
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    if (profile?.name && !formData.technicianName) {
      setFormData(prev => ({ ...prev, technicianName: profile.name }));
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 800 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 800KB for offline-first documents.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }
    
    setUploadingDoc(true);
    try {
      const newAttachments = await Promise.all(validFiles.map(async (file, index) => {
        const base64Str = await fileToBase64(file);
        return {
          id: Date.now().toString() + index,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: base64Str
        };
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to process document.");
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleRemoveDocument = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploadingImage(true);
    try {
      const newPhotos = await Promise.all(files.map(compressImage));
      setPhotos(prev => [...prev, ...newPhotos]);
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
    if (!profile) return;
    setLoading(true);

    try {
      const parsedDate = new Date(formData.date);
      // add current time to the date so it's not midnight UTC
      const now = new Date();
      parsedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      
      const newJob: Omit<Job, 'id'> = {
        title: formData.title,
        description: formData.description,
        equipment: formData.equipment,
        location: formData.location,
        status: formData.status,
        date: parsedDate.getTime(),
        technicianId: profile.id,
        technicianName: formData.technicianName || profile.name,
        photos: photos,
        attachments: attachments,
        partsUsed: [],
        resolutionNotes: '',
        createdBy: profile.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'jobs'), newJob);
      await logJobHistory(docRef.id, profile.id, profile.name, 'created', 'Job created');
      navigate(`/jobs/${docRef.id}`);
    } catch (error: any) {
      console.error("Error creating job", error);
      if (error?.message?.includes("too large") || error?.code === "resource-exhausted") {
        alert("The total size of photos and documents exceeds the database limit (1MB). Please remove some files.");
      } else {
        alert("Failed to create job.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8 h-full">
      <div className="flex items-center gap-4">
        <Link to="/jobs" className="p-2 bg-slate-100 hover:bg-slate-200 rounded transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Create New Job</h1>
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
                placeholder="e.g. HVAC Maintenance"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="e.g. Carrier RTU-12"
                />
              </div>

              <div>
                <label htmlFor="technicianName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Technician</label>
                <input
                  type="text"
                  id="technicianName"
                  name="technicianName"
                  required
                  value={formData.technicianName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Technician Name"
                />
              </div>
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
                  placeholder="e.g. Building 4, Roof"
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
                placeholder="Describe the problem reported..."
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Initial Status</label>
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attachments</label>
              
              {/* Image Grid */}
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
                        className="absolute top-1.5 right-1.5 bg-white p-1 rounded-full text-slate-600 hover:bg-red-50 hover:text-red-600 shadow-sm opacity-100 transition-all border border-slate-200"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Document List */}
              {attachments.length > 0 && (
                <div className="space-y-2 mb-4">
                  {attachments.map((doc, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-md shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{doc.name}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">{(doc.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveDocument(index)}
                        className="text-slate-400 hover:text-red-600 p-2 shrink-0 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    id="camera-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="camera-upload"
                    className={`bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded hover:bg-slate-100 cursor-pointer flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors w-full border-dashed ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Camera className="w-4 h-4" /> 
                    {uploadingImage ? 'Processing...' : 'Photo'}
                  </label>
                </div>
                <div>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    multiple
                    id="doc-upload"
                    className="hidden"
                    onChange={handleDocumentChange}
                  />
                  <label 
                    htmlFor="doc-upload"
                    className={`bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded hover:bg-slate-100 cursor-pointer flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors w-full border-dashed ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Paperclip className="w-4 h-4" /> 
                    {uploadingDoc ? 'Uploading...' : 'Document'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-bold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Create Job'}
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
