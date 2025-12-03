import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseCard } from './CourseCard';
import { EnrichedCourse } from '../types';

declare const jest: any;
declare const describe: any;
declare const test: any;
declare const expect: any;

describe('CourseCard Component', () => {
  const mockCourse: EnrichedCourse = {
    id: '1',
    collegeId: 'c1',
    courseName: 'Computer Science',
    fees: 500000,
    duration: '4 Years',
    description: 'A great course',
    rating: 4.5,
    ratingCount: 10,
    collegeName: 'Test College',
    location: 'Mumbai',
    state: 'Maharashtra',
    logoUrl: 'logo.png'
  };

  const mockRate = jest.fn();
  const mockClick = jest.fn();

  test('renders course details correctly', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        onRate={mockRate}
        onClick={mockClick}
      />
    );

    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Test College')).toBeInTheDocument();
    expect(screen.getByText(/Mumbai, Maharashtra/i)).toBeInTheDocument();
    expect(screen.getByText(/5,00,000/)).toBeInTheDocument();
    expect(screen.getByText('4 Years')).toBeInTheDocument();
  });

  test('calls onClick when card is clicked', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        onRate={mockRate}
        onClick={mockClick}
      />
    );

    fireEvent.click(screen.getByText('Computer Science'));
    expect(mockClick).toHaveBeenCalledWith(mockCourse);
  });
  
  test('renders AI Insights button', () => {
      render(
      <CourseCard 
        course={mockCourse} 
        onRate={mockRate}
        onClick={mockClick}
      />
    );
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });
});