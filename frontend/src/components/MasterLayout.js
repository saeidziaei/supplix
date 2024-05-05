import React from 'react';

const MasterLayout = ({children}) => {
    return (
        <div className='w-full md:w-[calc(100%-1rem)] md:p-4 md:bg-gradient-to-br from-gray-300 to-gray-100 md:m-[.5rem]  rounded-2xl'>
            <div className='w-full bg-white md:rounded-2xl md:shadow-[rgba(0,_0,_0,_0.24)_0px_3px_8px] md:p-3'>
                {children}
            </div>
        </div>
    );
};

export default MasterLayout;