export const getRSSHeadlines = async () => {
    // TODO: Integrate with Tiny Tiny RSS (TT-RSS) API
    // Requires Authentication with user's instance
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: '1',
        title: 'SolidJS 2.0 Announced: Everything You Need to Know',
        source: 'Hacker News',
        publishedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'SpaceX Successfully Launches Starship',
        source: 'TechCrunch',
        publishedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        title: 'The Future of Web Development in 2026',
        source: 'Dev.to',
        publishedAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
};
