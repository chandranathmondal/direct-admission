
import { Course, User, UserRole, College } from './types';

export const INITIAL_ADMIN_EMAIL = "chandranathmondal@yahoo.com";

export const STATES_OF_INDIA = [
  "West Bengal"
];

export const INITIAL_COLLEGES: College[] = [
  {
    id: 'c1',
    name: 'Indian Institute of Technology (IIT) Kharagpur',
    location: 'Kharagpur',
    state: 'West Bengal',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/IIT_Kharagpur_Logo.svg/1200px-IIT_Kharagpur_Logo.svg.png',
    description: 'The first IIT established in 1951, known for its vast campus and excellence in science and technology.',
    rating: 4.9,
    ratingCount: 3200
  },
  {
    id: 'c2',
    name: 'Jadavpur University',
    location: 'Kolkata',
    state: 'West Bengal',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/58/Jadavpur_University_Logo.svg/1200px-Jadavpur_University_Logo.svg.png',
    description: 'A premier state university known for its high-impact research and affordable education in engineering and arts.',
    rating: 4.8,
    ratingCount: 4500
  },
  {
    id: 'c3',
    name: 'Institute of Engineering and Management (IEM)',
    location: 'Kolkata',
    state: 'West Bengal',
    logoUrl: 'https://iem.edu.in/wp-content/uploads/2016/09/IEM-Logo.png',
    description: 'One of the top private engineering and management campuses in West Bengal.',
    rating: 4.4,
    ratingCount: 1800
  },
  {
    id: 'c4',
    name: 'Heritage Institute of Technology',
    location: 'Kolkata',
    state: 'West Bengal',
    logoUrl: 'https://www.heritageit.edu/images/logo.png',
    description: 'An autonomous institute with excellent infrastructure and placement records.',
    rating: 4.3,
    ratingCount: 1500
  },
  {
    id: 'c5',
    name: 'Calcutta University',
    location: 'Kolkata',
    state: 'West Bengal',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c9/University_of_Calcutta_Logo.svg/1200px-University_of_Calcutta_Logo.svg.png',
    description: 'One of the oldest and most prestigious universities in India with a rich legacy.',
    rating: 4.5,
    ratingCount: 2800
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: '1',
    collegeId: 'c1',
    courseName: 'B.Tech Computer Science & Engineering',
    fees: 850000,
    duration: '4 Years',
    description: 'Top-ranked CSE program with world-class research facilities and global alumni network.',
    rating: 4.9,
    ratingCount: 850
  },
  {
    id: '2',
    collegeId: 'c2',
    courseName: 'B.E. Mechanical Engineering',
    fees: 12000,
    duration: '4 Years',
    description: 'Highly competitive program with exceptional ROI and industry connections.',
    rating: 4.8,
    ratingCount: 600
  },
  {
    id: '3',
    collegeId: 'c3',
    courseName: 'B.Tech Electronics & Communication',
    fees: 650000,
    duration: '4 Years',
    description: 'Focuses on modern electronics, IoT, and communication systems.',
    rating: 4.3,
    ratingCount: 300
  },
  {
    id: '4',
    collegeId: 'c4',
    courseName: 'B.Tech Biotechnology',
    fees: 450000,
    duration: '4 Years',
    description: 'Advanced curriculum covering genetic engineering and bioinformatics.',
    rating: 4.2,
    ratingCount: 200
  },
  {
    id: '5',
    collegeId: 'c5',
    courseName: 'M.Sc Applied Physics',
    fees: 6000,
    duration: '2 Years',
    description: 'Renowned postgraduate program producing leading physicists and researchers.',
    rating: 4.6,
    ratingCount: 400
  }
];

export const INITIAL_USERS: User[] = [
  {
    email: INITIAL_ADMIN_EMAIL,
    name: 'Chandranath Mondal',
    role: UserRole.ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Chandranath+Mondal&background=f97316&color=fff'
  }
];
