// ECON207 Student Roster — Semester IV 2025-26
// Students join the game by entering their student ID

export interface RosterEntry {
  studentId: string;
  name: string;
  email: string;
}

export const ROSTER: RosterEntry[] = [
  { studentId: '240660', name: 'Tanvi', email: 'tanvi.hans@flame.edu.in' },
  { studentId: '240800', name: 'Anainah Adajania', email: 'anainah.adajania@flame.edu.in' },
  { studentId: '240589', name: 'Shreyansh Agarwal', email: 'shreyansh.agarwal@flame.edu.in' },
  { studentId: '240692', name: 'Amaira Ahuja', email: 'amaira.ahuja@flame.edu.in' },
  { studentId: '240229', name: 'Kirtana Amith', email: 'kirtana.amith@flame.edu.in' },
  { studentId: '240406', name: 'Samya Arora', email: 'samya.arora@flame.edu.in' },
  { studentId: '240683', name: 'Yugh Baid', email: 'yugh.baid@flame.edu.in' },
  { studentId: '240247', name: 'Rhea Batra', email: 'rhea.batra@flame.edu.in' },
  { studentId: '240295', name: 'Rashika Bhatter', email: 'rashika.bhatter@flame.edu.in' },
  { studentId: '240531', name: 'Ananya Buddhavarapu', email: 'ananya.buddhavarapu@flame.edu.in' },
  { studentId: '240496', name: 'Karan Chhibba', email: 'karan.chhibba@flame.edu.in' },
  { studentId: '240478', name: 'Adhya Damani', email: 'adhya.damani@flame.edu.in' },
  { studentId: '240849', name: 'Sai Jitha Vaishnavi Ganda', email: 'saijithavaishnavi.ganda@flame.edu.in' },
  { studentId: '240315', name: 'Kaanav Gathani', email: 'kaanav.gathani@flame.edu.in' },
  { studentId: '240536', name: 'Parthsarthi Goyal', email: 'parthsarthi.goyal@flame.edu.in' },
  { studentId: '240577', name: 'Kompal Grover', email: 'kompal.grover@flame.edu.in' },
  { studentId: '240394', name: 'Roshan Harwansh', email: 'roshan.harwansh@flame.edu.in' },
  { studentId: '240290', name: 'Akshat Jain', email: 'akshat.jain@flame.edu.in' },
  { studentId: '240373', name: 'Shristi Jain', email: 'shristi.jain@flame.edu.in' },
  { studentId: '240832', name: 'Naavya Jalan', email: 'naavya.jalan@flame.edu.in' },
  { studentId: '240945', name: 'Ishaan Kataria', email: 'ishaan.kataria@flame.edu.in' },
  { studentId: '240420', name: 'Zahida Khanum', email: 'zahida.khanum@flame.edu.in' },
  { studentId: '240267', name: 'Riddhi Khokle', email: 'riddhi.khokle@flame.edu.in' },
  { studentId: '240370', name: 'Mahira Khurana', email: 'mahira.khurana@flame.edu.in' },
  { studentId: '240305', name: 'Arya Kolpe', email: 'arya.kolpe@flame.edu.in' },
  { studentId: '240923', name: 'Ananth Krishna', email: 'ananth.krishna@flame.edu.in' },
  { studentId: '240552', name: 'Radha Kulkarni', email: 'radha.kulkarni@flame.edu.in' },
  { studentId: '240304', name: 'Aadya Kumar', email: 'aadya.kumar@flame.edu.in' },
  { studentId: '240277', name: 'Macknil Kumar', email: 'macknil.kumar@flame.edu.in' },
  { studentId: '240938', name: 'Aryan Madhogaria', email: 'aryan.madhogaria@flame.edu.in' },
  { studentId: '240395', name: 'Aratrik Mitra', email: 'aratrik.mitra@flame.edu.in' },
  { studentId: '240789', name: 'Akshat Nair', email: 'akshat.nair@flame.edu.in' },
  { studentId: '240248', name: 'Govind Nayanar', email: 'govind.nayanar@flame.edu.in' },
  { studentId: '240679', name: 'Reyansh Parmar', email: 'reyansh.parmar@flame.edu.in' },
  { studentId: '240603', name: 'Siddhartha Ray', email: 'siddhartha.ray@flame.edu.in' },
  { studentId: '240920', name: 'Nishta Sethia', email: 'nishta.sethia@flame.edu.in' },
  { studentId: '240858', name: 'Ananyaa Sharma', email: 'ananyaa.sharma@flame.edu.in' },
  { studentId: '240442', name: 'Sinchana Shenoi', email: 'sinchana.shenoi@flame.edu.in' },
  { studentId: '250752', name: 'Jaiaditya Singh', email: 'jaiditya.singh@flame.edu.in' },
  { studentId: '240705', name: 'Varun Vasudev', email: 'varun.vasudev@flame.edu.in' },
  { studentId: '240919', name: 'Govind Vedante', email: 'govind.vedante@flame.edu.in' },
  { studentId: '240551', name: 'Druthi Vanshika Vutukuru', email: 'druthi.vutukuru@flame.edu.in' },
];

// Lookup by student ID
export function findByStudentId(studentId: string): RosterEntry | undefined {
  return ROSTER.find(r => r.studentId === studentId);
}

// Lookup by name (for report card linking)
export function findByName(name: string): RosterEntry | undefined {
  return ROSTER.find(r => r.name === name);
}
