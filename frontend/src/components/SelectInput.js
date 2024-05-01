import React from 'react';
import {Select} from "semantic-ui-react";

const SelectInput = ({label , isMandatory , name , value, onChange ,error , options , ...restProps}) => {

    return (
        <div className='w-full '>
            <label className='w-full  flex flex-row items-center justify-start'>
                {label} {isMandatory && <span className='text-[#DA2A29]'>*</span>}
            </label>
            <Select options={options} onChange={onChange} clearable  placeholder={'Select'} className='w-full p-1 !rounded-xl !mt-1 *:!bg-[#E9EFF6] !bg-[#E9EFF6] !border-none  *:!border-none *:!rounded-2xl *:!outline-none hover:!shadow-lg transition duration-300'  />
            {
                error?.message?.length > 1 &&
                <span className='text-[#DA2A29]   !w-full  flex flex-row items-center justify-start text-[0.7rem]'>
                {error?.message}
            </span>
            }

        </div>
    );
};

export default SelectInput;