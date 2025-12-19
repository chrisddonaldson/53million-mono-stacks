export const getCalendarEvents = async () => {
    // TODO: Aggregate from Google (Personal/Work) and Hotmail
    // OAuth integration required.
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return [
      {
        id: '1',
        title: 'Team Standup (Work)',
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(today.getTime() + 10.5 * 60 * 60 * 1000).toISOString(),
        isAllDay: false
      },
      {
        id: '2',
        title: 'Lunch with Sarah (Personal)',
        startTime: new Date(today.getTime() + 12.5 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(today.getTime() + 13.5 * 60 * 60 * 1000).toISOString(),
        isAllDay: false
      },
      {
        id: '3',
        title: 'Project Review (Work)',
        startTime: new Date(today.getTime() + 15 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000).toISOString(),
        isAllDay: false
      }
    ];
};
