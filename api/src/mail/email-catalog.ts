import * as T from './mail.templates';

export interface EmailKind {
  key: string; // matches the label NotificationsService sends it under
  name: string;
  audience: string;
  trigger: string;
  // Security and money emails can't be switched off.
  locked?: boolean;
  sample: (appUrl: string) => T.EmailContent;
}

const soon = () => new Date(Date.now() + 3 * 86400000);

/** Every email the platform sends, in the order shown on Settings → Notification Templates. */
export const EMAIL_CATALOG: EmailKind[] = [
  {
    key: 'welcome', name: 'Welcome', audience: 'New learners', trigger: 'Right after someone creates an account',
    sample: (appUrl) => T.welcomeEmail({ firstName: 'Ada', appUrl }),
  },
  {
    key: 'password reset', name: 'Password reset', audience: 'Anyone', trigger: 'When someone asks to reset their password', locked: true,
    sample: (appUrl) => T.passwordResetEmail({ firstName: 'Ada', link: `${appUrl}/reset-password?token=preview` }),
  },
  {
    key: 'account created', name: 'Staff account created', audience: 'New instructors, assistants and admins', trigger: 'When an admin creates their account', locked: true,
    sample: (appUrl) => T.staffAccountEmail({ firstName: 'Tunde', role: 'instructor', email: 'tunde@example.com', link: `${appUrl}/reset-password?token=preview` }),
  },
  {
    key: 'payment receipt', name: 'Payment receipt', audience: 'Learners', trigger: 'When a payment is confirmed', locked: true,
    sample: (appUrl) => T.paymentReceiptEmail({ firstName: 'Ada', amount: 75000, reference: 'NN-PREVIEW-123', track: 'Cloud Engineering', cohort: 'Cohort 1', startDate: soon(), installment: { number: 1, total: 2 }, balance: 75000, appUrl }),
  },
  {
    key: 'enrollment status', name: 'Enrollment approved / declined', audience: 'Learners', trigger: 'When an admin approves or rejects an enrollment',
    sample: (appUrl) => T.enrollmentStatusEmail({ firstName: 'Ada', approved: true, track: 'Cloud Engineering', cohort: 'Cohort 1', appUrl }),
  },
  {
    key: 'program open', name: 'New track open for enrollment', audience: 'All learners', trigger: 'When a new track is added to a cohort',
    sample: (appUrl) => T.programOpenEmail({ firstName: 'Ada', track: 'Cloud Engineering', cohort: 'Cohort 1', startDate: soon(), price: 150000, description: 'Design, deploy and run systems in the cloud.', appUrl }),
  },
  {
    key: 'session scheduled', name: 'Live class scheduled', audience: "Learners and staff of the track", trigger: 'When a session is scheduled',
    sample: (appUrl) => T.sessionScheduledEmail({ firstName: 'Ada', title: 'Intro to Linux', description: 'Bring your laptop.', track: 'Cloud Engineering', scheduledAt: soon(), durationMinutes: 90, appUrl }),
  },
  {
    key: 'announcement', name: 'Announcement', audience: 'Learners the announcement is for', trigger: 'When staff post an announcement',
    sample: (appUrl) => T.announcementEmail({ firstName: 'Ada', title: 'Class moved to Thursday', body: "This week's session moves to Thursday at 6pm.", author: 'NetraNova team', appUrl }),
  },
  {
    key: 'submission graded', name: 'Assignment graded', audience: 'Learners', trigger: 'When an instructor grades a submission',
    sample: (appUrl) => T.submissionGradedEmail({ firstName: 'Ada', assignment: 'Week 1: Build a VPC', score: 45, maxScore: 50, feedback: 'Great work!', appUrl }),
  },
  {
    key: 'graduation decision', name: 'Graduation decision', audience: 'Learners', trigger: 'When an admin approves, holds or rejects a graduation',
    sample: (appUrl) => T.graduationDecisionEmail({ firstName: 'Ada', track: 'Cloud Engineering', status: 'approved', appUrl }),
  },
  {
    key: 'certificate issued', name: 'Certificate issued', audience: 'Learners', trigger: 'When a certificate is issued',
    sample: (appUrl) => T.certificateIssuedEmail({ firstName: 'Ada', cohort: 'Cohort 1', certificateNumber: 'NN-PREVIEW-ABCDE', issuedDate: new Date(), appUrl }),
  },
  {
    key: 'withdrawal received', name: 'Withdrawal received', audience: 'Learners', trigger: 'When a learner asks to withdraw',
    sample: () => T.withdrawalReceivedEmail({ firstName: 'Ada', track: 'Cloud Engineering', amountPaid: 150000, suggestedRefund: 75000 }),
  },
  {
    key: 'withdrawal resolved', name: 'Withdrawal decision / refund', audience: 'Learners', trigger: 'When an admin resolves a withdrawal', locked: true,
    sample: () => T.withdrawalResolvedEmail({ firstName: 'Ada', track: 'Cloud Engineering', approved: true, refund: 75000 }),
  },
];

export const emailKind = (key: string) => EMAIL_CATALOG.find((k) => k.key === key);
