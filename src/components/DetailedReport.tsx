import React, { useMemo, useState, useEffect } from 'react';
import { School, LicenseClass, DifferenceClass, CLASS_NAMES } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import useResponsive from '../hooks/useResponsive';
import { db } from '../firebase';
import { ref, onValue, off } from 'firebase/database';

interface DetailedReportProps {
  schools: School[];
}

const DetailedReport: React.FC<DetailedReportProps> = ({ schools: initialSchools }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [schools, setSchools] = useState<School[]>(initialSchools);
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

  useEffect(() => {
    const schoolsRef = ref(db, 'schools');
    const licenseFeesRef = ref(db, 'licenseFees');

    const schoolsListener = onValue(schoolsRef, (snapshot) => {
      if (snapshot.exists()) {
        const schoolsData = snapshot.val();
        const updatedSchools = Object.entries(schoolsData)
          .filter(([id]) => id !== 'admin')
          .map(([id, schoolData]: [string, any]) => ({
            id,
            name: schoolData.name,
            email: schoolData.email,
            candidates: schoolData.candidates || {},
          }));
        setSchools(updatedSchools);
      }
    });

    const licenseFeesListener = onValue(licenseFeesRef, (snapshot) => {
      if (snapshot.exists()) {
        setLicenseFees(snapshot.val());
      }
    });

    return () => {
      off(schoolsRef, 'value', schoolsListener);
      off(licenseFeesRef, 'value', licenseFeesListener);
    };
  }, []);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const calculateTotalFee = (candidates: School['candidates']) => {
    return Object.entries(candidates).reduce((total, [classType, count]) => {
      return total + count * licenseFees[classType as LicenseClass | DifferenceClass];
    }, 0);
  };

  const filteredSchools = useMemo(() => schools.filter(school => school.id !== 'admin'), [schools]);

  const classTypes: (LicenseClass | DifferenceClass)[] = isMobile
    ? ['B', 'A1', 'A2', 'C', 'D', 'FARK']
    : ['B', 'A1', 'A2', 'C', 'D', 'FARK_A1', 'FARK_A2', 'BAKANLIK_A1'];

  const shortenSchoolName = (name: string) => {
    if (isMobile) {
      const words = name.split(' ');
      return words[words.length - 2] || name;
    }
    if (isTablet) {
      return name.replace('ÖZEL BİGA ', '');
    }
    return name;
  };

  const getFontSize = () => {
    if (isMobile) return 'text-xs';
    if (isTablet) return 'text-sm';
    return 'text-base';
  };

  const getCandidateCount = (school: School, classType: string) => {
    if (classType === 'FARK' && isMobile) {
      return (school.candidates['FARK_A1'] || 0) + 
             (school.candidates['FARK_A2'] || 0) + 
             (school.candidates['BAKANLIK_A1'] || 0);
    }
    return school.candidates[classType as LicenseClass | DifferenceClass] || 0;
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className={`min-w-full bg-white ${getFontSize()}`}>
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">MTSK</th>
            {classTypes.map((classType) => (
              <th key={classType} className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                {isMobile ? classType : CLASS_NAMES[classType as LicenseClass | DifferenceClass]}
              </th>
            ))}
            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Toplam</th>
            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Ücret</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredSchools.map((school) => {
            const schoolTotalCandidates = Object.values(school.candidates).reduce((sum, count) => sum + count, 0);
            const schoolTotalFee = calculateTotalFee(school.candidates);
            return (
              <tr key={school.id}>
                <td className="px-2 py-2 whitespace-nowrap">{shortenSchoolName(school.name)}</td>
                {classTypes.map((classType) => (
                  <td key={classType} className="px-2 py-2 whitespace-nowrap">
                    {getCandidateCount(school, classType)}
                  </td>
                ))}
                <td className="px-2 py-2 whitespace-nowrap font-medium text-blue-600">{schoolTotalCandidates}</td>
                <td className="px-2 py-2 whitespace-nowrap font-medium text-green-600">{schoolTotalFee.toLocaleString('tr-TR')} TL</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 flex justify-between items-center">
        <h2 className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>Detaylı Rapor</h2>
        <button
          onClick={toggleExpand}
          className="text-white focus:outline-none transition-transform duration-200 ease-in-out transform hover:scale-110"
        >
          {isExpanded ? <ChevronUp size={isMobile ? 20 : 24} /> : <ChevronDown size={isMobile ? 20 : 24} />}
        </button>
      </div>
      {isExpanded && (
        <div className="p-4">
          {renderTable()}
          {isMobile && (
            <div className="mt-4 text-xs text-gray-500">
              Tablo yatay olarak kaydırılabilir. FARK sütunu A1, A2 ve Bakanlık A1 toplamını gösterir.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DetailedReport;