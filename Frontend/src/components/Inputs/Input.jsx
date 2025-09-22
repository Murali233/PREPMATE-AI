/* eslint-disable no-unused-vars */

import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const Input = ({value, onChange, label, placeholder, type }) => { 
    const [showPassword, setShowPassword] = useState(false);
    const toggleShowPassword = () => { 
        setShowPassword(!showPassword); 
    };
    return <div>
        <label className="text-[13px] text-slate-800">{label}</label>
        <div className="input-box">
            <input
            type={
                type == "password" ? (showPassword ? "text" : "password") : type
            }
            placeholder={placeholder}
            className="w-full bg-transparent outline-none overflow-hidden text-ellipsis whitespace-nowrap focus:ring-0 focus:ring-offset-0 focus:border-gray-300"
            value={value}
            onChange={(e) => onChange(e)}
            style={{ minWidth: 0 }} // Ensure the input can shrink below its content size
            />
            
            {type == "password" && (
                <>
                {showPassword ? (
                    <FaRegEye
                    size={22}
                    className="text-primary cursor-pointer" 
                    onClick={() => toggleShowPassword()}
                    />
                ) : (
                <FaRegEyeSlash
                size={22}
                className="text-slate-400 cursor-pointer"
                onClick={() => toggleShowPassword()}
                />
                )}
        </>
            )}
            </div>
            </div>
};
export default Input;