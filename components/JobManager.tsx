
import React, { useState, useRef } from 'react';
import { Job, Status } from '../types';
import { Plus, Upload, Trash2, Edit2, Check, X, Search, FileDown } from 'lucide-react';

interface JobManagerProps {
  category: string;
  subCategory: string;
  jobs: Job[];
  onAddJob: (job: Job) => void;
  onUpdateJob: (id: string, updates: Partial<Job>) => void;
  onDeleteJob: (id: string) => void;
  onBulkAddJobs: (jobs: Job[]) => void;
}

export const JobManager: React.FC<JobManagerProps> = ({
  category,
  subCategory,
  jobs,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onBulkAddJobs
}) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [formData, setFormData] = useState<Partial<Job>>({
    status: 'Pending',
    dateInput: new Date().toISOString().split('T')[0],
  });

  const isProductionMaster = category === "Produksi Master Data";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: Job = {
      id: crypto.randomUUID(),
      category,
      subCategory,
      dateInput: formData.dateInput || new Date().toISOString().split('T')[0],
      branchDept: formData.branchDept || '',
      jobType: formData.jobType || '',
      status: (formData.status as Status) || 'Pending',
      deadline: formData.deadline || '',
      activationDate: isProductionMaster ? formData.activationDate : undefined,
    };
    onAddJob(newJob);
    setFormData({
      status: 'Pending',
      dateInput: new Date().toISOString().split('T')[0],
      branchDept: '',
      jobType: '',
      deadline: ''
    });
    setView('list');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newJobs: Job[] = [];
      
      for(let i=1; i<lines.length; i++) {
        if(!lines[i].trim()) continue;
        const cols = lines[i].split(/,|;/); 
        if (cols.length >= 5) {
            newJobs.push({
                id: crypto.randomUUID(),
                category,
                subCategory,
                dateInput: cols[0]?.trim() || new Date().toISOString().split('T')[0],
                branchDept: cols[1]?.trim() || 'Unknown',
                jobType: cols[2]?.trim() || 'Imported Job',
                status: (['Pending','In Progress','Completed'].includes(cols[3]?.trim()) ? cols[3].trim() : 'Pending') as Status,
                deadline: cols[4]?.trim() || new Date().toISOString().split('T')[0],
                activationDate: isProductionMaster ? cols[5]?.trim() : undefined
            });
        }
      }
      
      if (newJobs.length > 0) {
          onBulkAddJobs(newJobs);
          alert(`Berhasil mengimport ${newJobs.length} data!`);
      } else {
          alert("Gagal membaca file atau format tidak sesuai.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const headers = ['Date Input', 'Branch/Dept', 'Job Type', 'Status', 'Deadline', isProductionMaster ? 'Activation Date' : ''].filter(Boolean).join(',');
    const rows = filteredJobs.map(job => {
      return [
        job.dateInput,
        `"${job.branchDept}"`, // Escape quotes
        `"${job.jobType}"`,
        job.status,
        job.deadline,
        isProductionMaster ? (job.activationDate || '') : ''
      ].filter((_, i) => isProductionMaster || i !== 5).join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `JNE_Jobs_${category}_${subCategory}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Jobs
  const filteredJobs = jobs.filter(j => 
    j.category === category && 
    j.subCategory === subCategory &&
    (j.branchDept.toLowerCase().includes(searchTerm.toLowerCase()) || 
     j.jobType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: Status, deadline: string) => {
    const isOverdue = new Date() > new Date(deadline) && status !== 'Completed';
    if (isOverdue) return 'bg-red-100 text-red-800 border-red-200';
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <span>{category}</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">{subCategory}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Daftar Pekerjaan</h2>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {view === 'list' ? (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.txt" 
                onChange={handleFileUpload}
              />
              <button 
                onClick={handleExportCSV}
                className="flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 border border-green-100 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <button 
                onClick={() => setView('form')}
                className="flex items-center justify-center px-4 py-2 bg-[#EE2E24] text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Manual
              </button>
            </>
          ) : (
             <button 
                onClick={() => setView('list')}
                className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4 mr-2" />
                Batal
              </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1">
        {view === 'form' ? (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-6">Input Data Pekerjaan Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Input</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.dateInput}
                    onChange={e => setFormData({...formData, dateInput: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cabang / Dept</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: Jakarta / Ops"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.branchDept}
                    onChange={e => setFormData({...formData, branchDept: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Pekerjaan</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Deskripsi pekerjaan..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.jobType}
                    onChange={e => setFormData({...formData, jobType: e.target.value})}
                  />
                </div>

                {isProductionMaster && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Aktifasi</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.activationDate || ''}
                      onChange={e => setFormData({...formData, activationDate: e.target.value})}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as Status})}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dateline (Batas Waktu)</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  className="px-6 py-2 bg-[#002F6C] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium shadow-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari berdasarkan Cabang atau Jenis Pekerjaan..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-4 whitespace-nowrap">Tanggal</th>
                    <th className="p-4 whitespace-nowrap">Cabang / Dept</th>
                    <th className="p-4">Jenis Pekerjaan</th>
                    {isProductionMaster && <th className="p-4 whitespace-nowrap">Aktifasi</th>}
                    <th className="p-4 whitespace-nowrap">Status</th>
                    <th className="p-4 whitespace-nowrap">Dateline</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={isProductionMaster ? 7 : 6} className="p-8 text-center text-gray-400">
                        Belum ada data pekerjaan untuk kategori ini.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 group transition-colors">
                        <td className="p-4">{new Date(job.dateInput).toLocaleDateString('id-ID')}</td>
                        <td className="p-4 font-medium text-gray-800">{job.branchDept}</td>
                        <td className="p-4 max-w-xs">{job.jobType}</td>
                        {isProductionMaster && (
                          <td className="p-4">{job.activationDate ? new Date(job.activationDate).toLocaleDateString('id-ID') : '-'}</td>
                        )}
                        <td className="p-4">
                          <select 
                            value={job.status}
                            onChange={(e) => onUpdateJob(job.id, { status: e.target.value as Status })}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border appearance-none cursor-pointer focus:outline-none ${getStatusColor(job.status, job.deadline)}`}
                          >
                             <option value="Pending">Pending</option>
                             <option value="In Progress">In Progress</option>
                             <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td className="p-4">
                           <span className={`text-xs font-semibold ${new Date() > new Date(job.deadline) && job.status !== 'Completed' ? 'text-red-600' : 'text-gray-600'}`}>
                             {new Date(job.deadline).toLocaleDateString('id-ID')}
                           </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => onDeleteJob(job.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
