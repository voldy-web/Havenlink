// What each review status of an owner's home means (shown to the owner and the admin).
export const statusInfo = {
  pending: { label: 'In review', tone: 'wait', text: 'We are checking your listing. It goes live as soon as it is approved.' },
  approved: { label: 'Live', tone: 'ok', text: 'Visitors can see this home.' },
  rejected: { label: 'Needs changes', tone: 'bad', text: 'Please fix the issue below and save to send it for review again.' },
  paused: { label: 'Paused', tone: 'off', text: 'Hidden from visitors. Resume it any time.' },
}
