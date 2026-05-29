const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function runBRE(data: {
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: string;
  pan: string;
}): { passed: boolean; rejectionReason?: string } {
  const today = new Date();
  const dob = new Date(data.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasBirthdayPassed) age -= 1;

  if (age < 23 || age > 50) {
    return { passed: false, rejectionReason: 'Age must be between 23 and 50.' };
  }

  if (data.monthlySalary < 25000) {
    return { passed: false, rejectionReason: 'Monthly salary must be at least ₹25,000.' };
  }

  if (data.employmentMode === 'Unemployed') {
    return { passed: false, rejectionReason: 'Unemployed applicants are not eligible.' };
  }

  if (!PAN_REGEX.test(data.pan)) {
    return { passed: false, rejectionReason: 'Invalid PAN format.' };
  }

  return { passed: true };
}
