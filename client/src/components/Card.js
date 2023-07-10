import React from "react";
import classes from "./Card.module.css";
import { motion } from 'framer-motion';

const textVariants = {
    out: { opacity: 0 },
    in: { opacity: 1 }
};

function Card(props) {
    const { title, text, isPlaceholder } = props;
    const textClass = isPlaceholder ? `${classes.text} ${classes.placeholder}` : classes.text;

    return (
        <div className={classes.container}>
            <div className={classes.headerContainer}>
                <label className={classes.headerText}>{title}</label>
            </div>
            <div className={classes.textContainer}>
                <motion.p 
                    className={textClass}
                    variants={textVariants}
                    initial="out"
                    animate="in"
                    exit="out"
                    key={text} // Force re-render when text changes
                    transition={{ duration: 0.5 }}
                >
                    {text}
                </motion.p>
            </div>
        </div>
    );
}

export default Card;
