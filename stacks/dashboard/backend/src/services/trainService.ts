export const getTrainDepartures = async () => {
    // TODO: Integrate with TfL Unified API for live Elizabeth Line data
    // Route: West Ealing -> Stratford
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
        {
            id: '1',
            destination: 'Stratford',
            dueInMinutes: 2,
            status: 'On Time',
            platform: '4'
        },
        {
            id: '2',
            destination: 'Stratford',
            dueInMinutes: 8,
            status: 'On Time',
            platform: '4'
        },
        {
            id: '3',
            destination: 'Shenfield',
            dueInMinutes: 16,
            status: 'Delayed',
            platform: '4'
        }
    ];
};
