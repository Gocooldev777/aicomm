import React from 'react';
import './AnimatedAvatar.css';

const AnimatedAvatar = ({ isActive, type }) => {
    return (
        <div className={`avatar-container ${type} ${isActive ? 'active' : ''}`}>
            <div className="avatar-image">
                <img 
                    src={isActive ? 
                        `/assets/${type}-speaking.gif` : 
                        `/assets/${type}-avatar.png`
                    } 
                    alt={`${type} avatar`}
                />
            </div>
            {isActive && (
                <div className="speech-indicator">
                    <div className="wave"></div>
                    <div className="wave"></div>
                    <div className="wave"></div>
                </div>
            )}
        </div>
    );
};

export default AnimatedAvatar;
