import React, { useState, useEffect } from 'react';
import { Send, Bell, DollarSign, FileText, RefreshCw, Trash2, Save } from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, push, remove, update, get } from 'firebase/database';
import { toast } from 'react-toastify';
import { LicenseClass, DifferenceClass, CLASS_NAMES } from '../types';

const AdminPanel: React.FC = () => {
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState<'meeting' | 'fee_collection' | 'price_update'>('meeting');
  const [licenseFees, setLicenseFees] = useState<{ [key in LicenseClass | DifferenceClass]: number }>({
    B: 0,
    A1: 0,
    A2: 0,
    C: 0,
    D: 0,
    FARK_A1: 0,
    FARK_A2: 0,
    BAKANLIK_A1: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const licenseFeesRef = ref(db, 'licenseFees');
    get(licenseFeesRef).then((snapshot) => {
      if (snapshot.exists()) {
        setLicenseFees(snapshot.val());
      }
      setIsLoading(false);
    }).catch((error) => {
      console.error("Error fetching license fees:", error);
      setIsLoading(false);
    });
  }, []);

  const addAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAnnouncement.trim() === '') return;

    try {
      const announcementsRef = ref(db, 'announcements');
      await push(announcementsRef, {
        content: newAnnouncement,
        type: announcementType,
        createdAt: Date.now(),
      });
      setNewAnnouncement('');
      toast.success('Duyuru başarıyla eklendi.');
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast.error('Duyuru eklenirken bir hata oluştu.');
    }
  };

  const updateLicenseFees = async () => {
    try {
      const licenseFeesRef = ref(db, 'licenseFees');
      await update(licenseFeesRef, licenseFees);
      toast.success('Ehliyet ücretleri başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating license fees:', error);
      toast.error('Ehliyet ücretleri güncellenirken bir hata oluştu.');
    }
  };

  const handleLicenseFeeChange = (licenseClass: LicenseClass | DifferenceClass, newFee: number) => {
    setLicenseFees(prev => ({ ...prev, [licenseClass]: newFee }));
  };

  const resetAllCandidates = async () => {
    if (window.confirm('Tüm adayların sayısını sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        const schoolsRef = ref(db, 'schools');
        const snapshot = await get(schoolsRef);
        if (snapshot.exists()) {
          const updates: { [key: string]: any } = {};
          snapshot.forEach((childSnapshot) => {
            const schoolId = childSnapshot.key;
            updates[`${schoolId}/candidates`] = {
              B: 0,
              A1: 0,
              A2: 0,
              C: 0,
              D: 0,
              FARK_A1: 0,
              FARK_A2: 0,
              BAKANLIK_A1: 0,
            };
          });
          await update(schoolsRef, updates);
          toast.success('Tüm adayların sayısı başarıyla sıfırlandı.');
        }
      } catch (error) {
        console.error('Error resetting candidates:', error);
        toast.error('Adaylar sıfırlanırken bir hata oluştu.');
      }
    }
  };

  const clearChat = async () => {
    if (window.confirm('Tüm sohbet geçmişini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        const messagesRef = ref(db, 'messages');
        await remove(messagesRef);
        toast.success('Sohbet geçmişi başarıyla temizlendi.');
      } catch (error) {
        console.error('Error clearing chat:', error);
        toast.error('Sohbet geçmişi temizlenirken bir hata oluştu.');
      }
    }
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Admin Paneli</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Duyuru Ekle</h3>
        <form onSubmit={addAnnouncement} className="space-y-4">
          <div>
            <label htmlFor="announcement" className="block text-sm font-medium text-gray-700">
              Duyuru İçeriği
            </label>
            <textarea
              id="announcement"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={3}
              placeholder="Duyuru metnini buraya girin..."
            ></textarea>
          </div>
          <div>
            <label htmlFor="announcementType" className="block text-sm font-medium text-gray-700">
              Duyuru Tipi
            </label>
            <select
              id="announcementType"
              value={announcementType}
              onChange={(e) => setAnnouncementType(e.target.value as 'meeting' | 'fee_collection' | 'price_update')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="meeting">Toplantı</option>
              <option value="fee_collection">Ücretlerin Toplanması</option>
              <option value="price_update">Ehliyet Fiyatlarının Güncellenmesi</option>
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Send className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Duyuru Ekle
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Ehliyet Ücretlerini Güncelle</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(CLASS_NAMES).map(([licenseClass, className]) => (
            <div key={licenseClass} className="flex items-center space-x-2">
              <span className="font-medium">{className}:</span>
              <input
                type="number"
                value={licenseFees[licenseClass as LicenseClass | DifferenceClass] || 0}
                onChange={(e) => handleLicenseFeeChange(licenseClass as LicenseClass | DifferenceClass, Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span>TL</span>
            </div>
          ))}
        </div>
        <button
          onClick={updateLicenseFees}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Save className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
          Ücretleri Kaydet
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Sistem İşlemleri</h3>
        <div className="space-y-4">
          <button
            onClick={resetAllCandidates}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Tüm Adayları Sıfırla
          </button>
          <button
            onClick={clearChat}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <Trash2 className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Sohbeti Temizle
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;