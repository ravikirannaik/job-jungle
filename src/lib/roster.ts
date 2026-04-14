// ECON207 Student Roster — Semester IV 2025-26
// Students join the game by selecting their section and entering their student ID

export type Section = 'A' | 'B';

export interface RosterEntry {
  studentId: string;
  name: string;
  email: string;
  section: Section;
}

export const ROSTER: RosterEntry[] = [
  // ─── Section A (42 students) ───
  { studentId: '240660', name: 'Tanvi', email: 'tanvi.hans@flame.edu.in', section: 'A' },
  { studentId: '240800', name: 'Anainah Adajania', email: 'anainah.adajania@flame.edu.in', section: 'A' },
  { studentId: '240589', name: 'Shreyansh Agarwal', email: 'shreyansh.agarwal@flame.edu.in', section: 'A' },
  { studentId: '240692', name: 'Amaira Ahuja', email: 'amaira.ahuja@flame.edu.in', section: 'A' },
  { studentId: '240229', name: 'Kirtana Amith', email: 'kirtana.amith@flame.edu.in', section: 'A' },
  { studentId: '240406', name: 'Samya Arora', email: 'samya.arora@flame.edu.in', section: 'A' },
  { studentId: '240683', name: 'Yugh Baid', email: 'yugh.baid@flame.edu.in', section: 'A' },
  { studentId: '240247', name: 'Rhea Batra', email: 'rhea.batra@flame.edu.in', section: 'A' },
  { studentId: '240295', name: 'Rashika Bhatter', email: 'rashika.bhatter@flame.edu.in', section: 'A' },
  { studentId: '240531', name: 'Ananya Buddhavarapu', email: 'ananya.buddhavarapu@flame.edu.in', section: 'A' },
  { studentId: '240496', name: 'Karan Chhibba', email: 'karan.chhibba@flame.edu.in', section: 'A' },
  { studentId: '240478', name: 'Adhya Damani', email: 'adhya.damani@flame.edu.in', section: 'A' },
  { studentId: '240849', name: 'Sai Jitha Vaishnavi Ganda', email: 'saijithavaishnavi.ganda@flame.edu.in', section: 'A' },
  { studentId: '240315', name: 'Kaanav Gathani', email: 'kaanav.gathani@flame.edu.in', section: 'A' },
  { studentId: '240536', name: 'Parthsarthi Goyal', email: 'parthsarthi.goyal@flame.edu.in', section: 'A' },
  { studentId: '240577', name: 'Kompal Grover', email: 'kompal.grover@flame.edu.in', section: 'A' },
  { studentId: '240394', name: 'Roshan Harwansh', email: 'roshan.harwansh@flame.edu.in', section: 'A' },
  { studentId: '240290', name: 'Akshat Jain', email: 'akshat.jain@flame.edu.in', section: 'A' },
  { studentId: '240373', name: 'Shristi Jain', email: 'shristi.jain@flame.edu.in', section: 'A' },
  { studentId: '240832', name: 'Naavya Jalan', email: 'naavya.jalan@flame.edu.in', section: 'A' },
  { studentId: '240945', name: 'Ishaan Kataria', email: 'ishaan.kataria@flame.edu.in', section: 'A' },
  { studentId: '240420', name: 'Zahida Khanum', email: 'zahida.khanum@flame.edu.in', section: 'A' },
  { studentId: '240267', name: 'Riddhi Khokle', email: 'riddhi.khokle@flame.edu.in', section: 'A' },
  { studentId: '240370', name: 'Mahira Khurana', email: 'mahira.khurana@flame.edu.in', section: 'A' },
  { studentId: '240305', name: 'Arya Kolpe', email: 'arya.kolpe@flame.edu.in', section: 'A' },
  { studentId: '240923', name: 'Ananth Krishna', email: 'ananth.krishna@flame.edu.in', section: 'A' },
  { studentId: '240552', name: 'Radha Kulkarni', email: 'radha.kulkarni@flame.edu.in', section: 'A' },
  { studentId: '240304', name: 'Aadya Kumar', email: 'aadya.kumar@flame.edu.in', section: 'A' },
  { studentId: '240277', name: 'Macknil Kumar', email: 'macknil.kumar@flame.edu.in', section: 'A' },
  { studentId: '240938', name: 'Aryan Madhogaria', email: 'aryan.madhogaria@flame.edu.in', section: 'A' },
  { studentId: '240395', name: 'Aratrik Mitra', email: 'aratrik.mitra@flame.edu.in', section: 'A' },
  { studentId: '240789', name: 'Akshat Nair', email: 'akshat.nair@flame.edu.in', section: 'A' },
  { studentId: '240248', name: 'Govind Nayanar', email: 'govind.nayanar@flame.edu.in', section: 'A' },
  { studentId: '240679', name: 'Reyansh Parmar', email: 'reyansh.parmar@flame.edu.in', section: 'A' },
  { studentId: '240603', name: 'Siddhartha Ray', email: 'siddhartha.ray@flame.edu.in', section: 'A' },
  { studentId: '240920', name: 'Nishta Sethia', email: 'nishta.sethia@flame.edu.in', section: 'A' },
  { studentId: '240858', name: 'Ananyaa Sharma', email: 'ananyaa.sharma@flame.edu.in', section: 'A' },
  { studentId: '240442', name: 'Sinchana Shenoi', email: 'sinchana.shenoi@flame.edu.in', section: 'A' },
  { studentId: '250752', name: 'Jaiaditya Singh', email: 'jaiditya.singh@flame.edu.in', section: 'A' },
  { studentId: '240705', name: 'Varun Vasudev', email: 'varun.vasudev@flame.edu.in', section: 'A' },
  { studentId: '240919', name: 'Govind Vedante', email: 'govind.vedante@flame.edu.in', section: 'A' },
  { studentId: '240551', name: 'Druthi Vanshika Vutukuru', email: 'druthi.vutukuru@flame.edu.in', section: 'A' },

  // ─── Section B (40 students) ───
  { studentId: '240206', name: 'Aditya Agarwal', email: 'aditya.a.agarwal@flame.edu.in', section: 'B' },
  { studentId: '240461', name: 'Lavannya Anand', email: 'lavannya.anand@flame.edu.in', section: 'B' },
  { studentId: '240545', name: 'Manvi Bakhtar', email: 'manvi.bakhtar@flame.edu.in', section: 'B' },
  { studentId: '220008', name: 'Kriti Bhargava', email: 'kriti.bhargava@flame.edu.in', section: 'B' },
  { studentId: '240266', name: 'Aarnav Choudhari', email: 'aarnav.choudhari@flame.edu.in', section: 'B' },
  { studentId: '240582', name: 'Britney Coutinho', email: 'britney.coutinho@flame.edu.in', section: 'B' },
  { studentId: '240439', name: "Ian D'Souza", email: 'ian.dsouza@flame.edu.in', section: 'B' },
  { studentId: '240371', name: 'Shahi Jahan Dar', email: 'shahijahan.dar@flame.edu.in', section: 'B' },
  { studentId: '240801', name: 'Aneri Gandhi', email: 'aneri.gandhi@flame.edu.in', section: 'B' },
  { studentId: '240239', name: 'Aditi Ganeshram', email: 'aditi.ganeshram@flame.edu.in', section: 'B' },
  { studentId: '240567', name: 'Pushpit Gill', email: 'pushpit.gill@flame.edu.in', section: 'B' },
  { studentId: '240839', name: 'Ananya Gupta', email: 'ananya.m.gupta@flame.edu.in', section: 'B' },
  { studentId: '240569', name: 'Soumya Gupta', email: 'soumya.gupta@flame.edu.in', section: 'B' },
  { studentId: '240436', name: 'Advika Jain', email: 'advika.jain@flame.edu.in', section: 'B' },
  { studentId: '240868', name: 'Niyati Joseph', email: 'niyati.joseph@flame.edu.in', section: 'B' },
  { studentId: '240881', name: 'Siya Kabra', email: 'siya.kabra@flame.edu.in', section: 'B' },
  { studentId: '240681', name: 'Dishaa Kapoor', email: 'dishaa.kapoor@flame.edu.in', section: 'B' },
  { studentId: '240645', name: 'Satya Karri', email: 'satya.karri@flame.edu.in', section: 'B' },
  { studentId: '240704', name: 'Vihaan Kohli', email: 'vihaan.kohli@flame.edu.in', section: 'B' },
  { studentId: '240636', name: 'Sri Kommanapalli', email: 'sri.kommanapalli@flame.edu.in', section: 'B' },
  { studentId: '240895', name: 'Aryan Malhotra', email: 'aryan.malhotra@flame.edu.in', section: 'B' },
  { studentId: '240413', name: 'Pratyush Mittal', email: 'pratyush.mittal@flame.edu.in', section: 'B' },
  { studentId: '240318', name: 'Ridhima Mittal', email: 'ridhima.mittal@flame.edu.in', section: 'B' },
  { studentId: '240243', name: 'Shrinithi Nandhakumar', email: 'shrinithi.nandhakumar@flame.edu.in', section: 'B' },
  { studentId: '240825', name: 'Muskaan Patel', email: 'muskaan.patel@flame.edu.in', section: 'B' },
  { studentId: '240680', name: 'Hansika Reddy Pulugu', email: 'hansika.pulugu@flame.edu.in', section: 'B' },
  { studentId: '240943', name: 'Arushi Rastogi', email: 'arushi.rastogi@flame.edu.in', section: 'B' },
  { studentId: '240843', name: 'Shanaika Ratreja', email: 'shanaika.ratreja@flame.edu.in', section: 'B' },
  { studentId: '240714', name: 'Muhammed Rayan', email: 'muhammed.rayan@flame.edu.in', section: 'B' },
  { studentId: '230762', name: 'Leethika Reddy', email: 'leethika.reddy@flame.edu.in', section: 'B' },
  { studentId: '240675', name: 'Danvy S', email: 'danvy.s@flame.edu.in', section: 'B' },
  { studentId: '240312', name: 'Kaviyaazhini S K', email: 'kaviyaazhini.sk@flame.edu.in', section: 'B' },
  { studentId: '220498', name: 'Jahnavi Sant', email: 'jahnavi.sant@flame.edu.in', section: 'B' },
  { studentId: '240516', name: 'Siddhartha Sen', email: 'siddhartha.sen@flame.edu.in', section: 'B' },
  { studentId: '240888', name: 'Manan Shah', email: 'manan.shah@flame.edu.in', section: 'B' },
  { studentId: '240737', name: 'Tanish Sharan', email: 'tanish.sharan@flame.edu.in', section: 'B' },
  { studentId: '240713', name: 'Dhanakshi Sharma', email: 'dhanakshi.sharma@flame.edu.in', section: 'B' },
  { studentId: '240842', name: 'Vivek Singh', email: 'vivek.k.singh@flame.edu.in', section: 'B' },
  { studentId: '240653', name: 'Miti Soni', email: 'miti.soni@flame.edu.in', section: 'B' },
  { studentId: '240670', name: 'Neel Vyas', email: 'neel.vyas@flame.edu.in', section: 'B' },
];

// Lookup by student ID (unique across sections)
export function findByStudentId(studentId: string): RosterEntry | undefined {
  return ROSTER.find(r => r.studentId === studentId);
}

// Lookup by name (for report card linking)
export function findByName(name: string): RosterEntry | undefined {
  return ROSTER.find(r => r.name === name);
}
