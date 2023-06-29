import React from "react";
import classes from "./Card.module.css";

function Card(props) {
    const { title, text, isPlaceholder } = props;
    const textClass = isPlaceholder ? `${classes.text} ${classes.placeholder}` : classes.text;

    return (
        <div className={classes.container}>
            <div className={classes.headerContainer}>
                <label className={classes.headerText}>{title}</label>
            </div>
            <div className={classes.textContainer}>
                <p className={textClass}>{text}</p>
            </div>
        </div>
    );
}

export default Card;
