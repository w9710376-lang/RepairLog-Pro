import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Job, Part, JobHistoryEvent } from '../types';
import { ArrowLeft, Plus, Trash2, Camera, X, Edit, FileText, Paperclip, Download } from 'lucide-react';
import { format } from 'date-fns';
import { compressImage } from '../lib/imageUtils';
import { logJobHistory } from '../lib/history';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<JobHistoryEvent[]>([]);
  
  const [newPart, setNewPart] = useState<Part>({ name: '', cost: 0, quantity: 1 });

  const fetchHistory = async () => {
    if (!id) return;
    try {
      const q = query(
        collection(db, 'jobHistory'),
        where('jobId', '==', id)
      );
      const snapshot = await getDocs(q);
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as JobHistoryEvent));
      historyData.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(historyData);
    } catch (error) {
      console.error("Error fetching history", error);
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'jobs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as unknown as Job);
          await fetchHistory();
        } else {
          navigate('/jobs');
        }
      } catch (error) {
        console.error("Error fetching job", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, navigate]);

  const handleUpdate = async (field: keyof Job, value: any) => {
    if (!job || !id || !profile) return;
    
    const tempJob = { ...job, [field]: value };
    if (JSON.stringify(tempJob).length > 900000) {
      alert("Adding this item would exceed the 1MB database limit. Please remove some existing photos or documents first.");
      throw new Error("Size limit exceeded");
    }
    setSaving(true);
    try {
      const docRef = doc(db, 'jobs', id);
      await updateDoc(docRef, { [field]: value, updatedAt: Date.now() });
      setJob(prev => prev ? { ...prev, [field]: value } : null);
      
      let action: any = 'updated';
      let details = `Updated ${field}`;
      if (field === 'status') {
        action = 'status_changed';
        details = `Status changed to ${value}`;
      } else if (field === 'partsUsed') {
        action = 'part_updated';
        details = `Parts list updated`;
      } else if (field === 'resolutionNotes') {
        action = 'note_updated';
        details = `Resolution notes updated`;
      } else if (field === 'attachments') {
        action = 'attachment_updated';
        details = `Attachments updated`;
      } else if (field === 'photos') {
        action = 'photo_updated';
        details = `Photos updated`;
      }
      
      await logJobHistory(id, profile.id, profile.name, action, details);
      await fetchHistory();
    } catch (error: any) {
      if (!(error?.message?.includes("too large") || error?.message?.includes("exceeds") || error?.message?.includes("Size limit exceeded"))) { console.error("Error updating job", error); }
      if (error?.message?.includes("too large") || error?.message?.includes("exceeds the maximum allowed size") || error?.message?.includes("exceeds") || error?.code === "resource-exhausted") {
        alert("The total size of photos and documents exceeds the database limit (1MB). Please remove some files.");
      } else {
        alert("Update failed: " + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const addPart = async () => {
    if (!job || !id || !newPart.name) return;
    const updatedParts = [...job.partsUsed, newPart];
    await handleUpdate('partsUsed', updatedParts);
    setNewPart({ name: '', cost: 0, quantity: 1 });
  };

  const removePart = async (index: number) => {
    if (!job || !id) return;
    const updatedParts = job.partsUsed.filter((_, i) => i !== index);
    await handleUpdate('partsUsed', updatedParts);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };


  const handleRemovePhoto = async (indexToRemove) => {
    if (!job || !id) return;
    if (!window.confirm("Are you sure you want to remove this photo?")) return;
    try {
      const updatedPhotos = job.photos.filter((_, i) => i !== indexToRemove);
      await handleUpdate('photos', updatedPhotos);
    } catch (error) {
      console.error("Error removing photo:", error);
    }
  };

  const handleRemoveDocument = async (idToRemove) => {
    if (!job || !id || !job.attachments) return;
    if (!window.confirm("Are you sure you want to remove this document?")) return;
    try {
      const updatedAttachments = job.attachments.filter(doc => doc.id !== idToRemove);
      await handleUpdate('attachments', updatedAttachments);
    } catch (error) {
      console.error("Error removing document:", error);
    }
  };

  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!job || !id || files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 250 * 1024) {
        alert("File " + file.name + " is too large. Maximum size is 250KB.");
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
      const updatedAttachments = [...(job.attachments || []), ...newAttachments];
      await handleUpdate('attachments', updatedAttachments);
    } catch (error: any) {
      if (!(error?.message?.includes("too large") || error?.message?.includes("exceeds") || error?.message?.includes("Size limit exceeded"))) { console.error("Error uploading document:", error); }
      if (error?.message?.includes("too large") || error?.message?.includes("exceeds the maximum allowed size") || error?.message?.includes("exceeds") || error?.code === "resource-exhausted") {
        alert("The total size of photos and documents exceeds the database limit (1MB). Please remove some files.");
      } else {
        alert("Failed to process document.");
      }
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!job || !id || files.length === 0) return;
    
    setUploadingImage(true);
    try {
      const newPhotos = await Promise.all(files.map(compressImage));
      const updatedPhotos = [...job.photos, ...newPhotos];
      await handleUpdate('photos', updatedPhotos);
    } catch (error: any) {
      if (!(error?.message?.includes("too large") || error?.message?.includes("exceeds") || error?.message?.includes("Size limit exceeded"))) { console.error("Error compressing image:", error); }
      if (error?.message?.includes("too large") || error?.message?.includes("exceeds the maximum allowed size") || error?.message?.includes("exceeds") || error?.code === "resource-exhausted") {
        alert("The total size of photos and documents exceeds the database limit (1MB). Please remove some files.");
      } else {
        alert("Failed to process image.");
      }
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'jobs', id));
      navigate('/jobs');
    } catch (error: any) {
      console.error("Delete failed", error);
      alert("Failed to delete job: " + error.message);
      setIsDeleting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  const canEdit = true;
  const totalCost = job.partsUsed.reduce((sum, part) => sum + (part.cost * part.quantity), 0);

  return (
    <div className="max-w-4xl w-full mx-auto space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8 h-full">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/jobs" className="p-2 bg-slate-100 hover:bg-slate-200 rounded transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <div className="text-xs font-mono text-slate-400 mb-1 tracking-widest">JOB DETAIL • #{job.id.slice(0, 8).toUpperCase()}</div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{job.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link 
                to={`/jobs/${job.id}/edit`} 
                className="text-slate-600 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors border border-slate-200"
              >
                <Edit className="w-4 h-4 inline mr-1" /> Edit Job
              </Link>
            )}
            {canEdit && (
              <button onClick={handleDeleteClick} className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors border border-red-100">
                <Trash2 className="w-4 h-4 inline mr-1" /> Delete Job
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Equipment Metadata</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-[10px] text-slate-400 uppercase">Equipment ID</p>
                  <p className="text-sm font-bold text-slate-800">{job.equipment}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-[10px] text-slate-400 uppercase">Location</p>
                  <p className="text-sm font-bold text-slate-800">{job.location}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-[10px] text-slate-400 uppercase">Technician</p>
                  <p className="text-sm font-bold text-slate-800">{job.technicianName}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-[10px] text-slate-400 uppercase">Date Logged</p>
                  <p className="text-sm font-bold text-slate-800">{format(job.date, 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Notes & Description</h4>
              <div className="space-y-3">
                <div className="border-l-2 border-slate-200 pl-4 py-1">
                  <p className="text-[11px] text-slate-400 font-bold uppercase mb-1">ISSUE REPORTED</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Resolution Notes</h4>
              {canEdit ? (
                <textarea
                  value={job.resolutionNotes}
                  onChange={(e) => setJob({...job, resolutionNotes: e.target.value})}
                  onBlur={(e) => handleUpdate('resolutionNotes', e.target.value)}
                  rows={4}
                  placeholder="Add diagnostic and resolution notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                />
              ) : (
                <div className="border-l-2 border-slate-200 pl-4 py-1">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.resolutionNotes || 'No notes yet.'}</p>
                </div>
              )}
            </div>
            
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status Control</h4>
              {canEdit ? (
                <select
                  value={job.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                  className={`w-full bg-slate-100 border-none rounded px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase tracking-wider
                    ${job.status === 'completed' ? 'text-emerald-700 bg-emerald-50' : 
                      job.status === 'in_progress' ? 'text-blue-700 bg-blue-50' : 
                      'text-amber-700 bg-amber-50'}
                  `}
                >
                  <option value="pending">PENDING</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="completed">COMPLETED</option>
                </select>
              ) : (
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase w-max
                  ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                    'bg-amber-100 text-amber-700'}
                `}>
                  {job.status.replace('_', ' ')}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Parts Consumed</h4>
              
              <table className="w-full text-left text-sm mb-4">
                <thead>
                  <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-bold">ITEM</th>
                    <th className="pb-2 text-right font-bold">QTY</th>
                    <th className="pb-2 text-right font-bold">COST</th>
                    {canEdit && <th className="pb-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {job.partsUsed.map((part, index) => (
                    <tr key={index} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{part.name}</td>
                      <td className="py-2 text-right text-slate-600">{part.quantity}</td>
                      <td className="py-2 text-right text-slate-600">${(part.cost * part.quantity).toFixed(2)}</td>
                      {canEdit && (
                        <td className="py-2 text-right">
                          <button onClick={() => removePart(index)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4 ml-auto" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {job.partsUsed.length > 0 && (
                <div className="flex justify-end text-sm font-bold text-slate-800 mb-4">
                  Total Parts: ${totalCost.toFixed(2)}
                </div>
              )}
              {job.partsUsed.length === 0 && <p className="text-sm text-slate-500 mb-4">No parts recorded.</p>}

              {canEdit && (
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <input 
                    type="text" 
                    placeholder="Part name" 
                    value={newPart.name} 
                    onChange={e => setNewPart({...newPart, name: e.target.value})}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />
                  <input 
                    type="number" 
                    placeholder="Cost" 
                    value={newPart.cost || ''} 
                    onChange={e => setNewPart({...newPart, cost: Number(e.target.value)})}
                    className="w-24 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />
                  <input 
                    type="number" 
                    placeholder="Qty" 
                    value={newPart.quantity || ''} 
                    onChange={e => setNewPart({...newPart, quantity: Number(e.target.value)})}
                    className="w-16 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />
                  <button onClick={addPart} className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Attachments</h4>
              
              {/* Image Grid */}
              {job.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {job.photos.map((url, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square bg-slate-200 rounded-md border border-slate-300 flex items-center justify-center overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={`Job ${index}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {canEdit && (
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemovePhoto(index); }}
                          className="absolute top-1.5 right-1.5 bg-white p-1 rounded-full text-slate-600 hover:bg-red-50 hover:text-red-600 shadow-sm opacity-100 transition-all border border-slate-200"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Document List */}
              {job.attachments && job.attachments.length > 0 && (
                <div className="space-y-2 mb-4">
                  {job.attachments.map((doc, idx) => (
                    <a 
                      key={doc.id || idx}
                      href={doc.data}
                      download={doc.name}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
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
                      <div className="flex items-center gap-2 px-2 shrink-0">
                        <div className="text-slate-400 group-hover:text-blue-600 p-2">
                          <Download className="w-4 h-4" />
                        </div>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveDocument(doc.id || idx.toString()); }}
                            className="text-slate-400 hover:text-red-600 p-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
              
              {job.photos.length === 0 && (!job.attachments || job.attachments.length === 0) && (
                <p className="text-sm text-slate-500 mt-2">No attachments.</p>
              )}

              {canEdit && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      id="camera-upload-detail"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label 
                      htmlFor="camera-upload-detail"
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
                      id="doc-upload-detail"
                      className="hidden"
                      onChange={handleDocumentChange}
                    />
                    <label 
                      htmlFor="doc-upload-detail"
                      className={`bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded hover:bg-slate-100 cursor-pointer flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors w-full border-dashed ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <Paperclip className="w-4 h-4" /> 
                      {uploadingDoc ? 'Uploading...' : 'Document'}
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-4 text-xs text-slate-500 font-medium uppercase">
            <span>Created: {format(job.createdAt, 'MMM d, HH:mm')}</span>
            <span>Updated: {format(job.updatedAt, 'MMM d, HH:mm')}</span>
          </div>
          <div className="flex gap-2">
            {canEdit && job.status !== 'completed' && (
              <button 
                onClick={() => handleUpdate('status', 'completed')}
                className="bg-emerald-600 text-white px-4 py-2 rounded text-xs font-bold shadow-sm hover:bg-emerald-700"
              >
                Mark as Resolved
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Change History</h3>
        
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No history recorded yet.</p>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:ml-[5.5rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
            {history.map((event, idx) => (
              <div key={event.id || idx} className="relative flex items-start gap-4 md:gap-6">
                <div className="hidden md:block w-20 text-right shrink-0 mt-0.5">
                  <div className="text-[10px] font-bold text-slate-500 leading-tight">
                    {format(event.timestamp, 'MMM d')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {format(event.timestamp, 'h:mm a')}
                  </div>
                </div>
                
                <div className="absolute left-0 md:static flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 border-2 border-white shrink-0 mt-0.5 z-10 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                </div>
                
                <div className="flex-1 ml-8 md:ml-0">
                  <div className="md:hidden flex gap-2 items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-500">{format(event.timestamp, 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm">
                    <div className="font-medium text-slate-800">{event.details}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      by <span className="font-semibold text-slate-700">{event.userName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete this job?</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Are you sure you want to delete this job? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
