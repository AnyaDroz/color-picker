import React, { useRef, useState, useEffect } from "react";
import styles from "./ColorPicker.module.css";

const ColorPicker = () => {
    const colorPickerRef = useRef<HTMLCanvasElement>(null);
    const [selectedColor, setSelectedColor] = useState<string>("rgb(0, 61, 255)");
    const [selectedTriangleColor, setSelectedTriangleColor] = useState<string>("");
    const [handlePosition, setHandlePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [triangleHandlePosition, setTriangleHandlePosition] = useState<{ x: number; y: number }>({ x: 90, y: 90 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isDraggingTriangle, setIsDraggingTriangle] = useState<boolean>(false);

    const doughnutThickness = 16;
    const handleRadius = 4;
    const rotationAngle = 120 * (Math.PI / 180);

    useEffect(() => {
        const canvas = colorPickerRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                const radius = canvas.width / 2;
                const innerRadius = radius - doughnutThickness / 2;
                const cutoutRadius = innerRadius;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const gradient = ctx.createConicGradient(0, radius, radius);
                gradient.addColorStop(0, "red");
                gradient.addColorStop(1 / 6, "yellow");
                gradient.addColorStop(2 / 6, "lime");
                gradient.addColorStop(3 / 6, "cyan");
                gradient.addColorStop(4 / 6, "blue");
                gradient.addColorStop(5 / 6, "magenta");
                gradient.addColorStop(1, "red");

                ctx.fillStyle = gradient;

                ctx.beginPath();
                ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
                ctx.fill();

                ctx.globalCompositeOperation = "destination-out";
                ctx.beginPath();
                ctx.arc(radius, radius, cutoutRadius, 0, 2 * Math.PI);
                ctx.fill();

                ctx.globalCompositeOperation = "source-over";

                if (selectedColor) {
                    const angle = handlePositionToAngle(handlePosition, radius) + rotationAngle;
                    const triangleSize = innerRadius * 2;
                    const triangleHeight = (Math.sqrt(3) / 2) * triangleSize;
                    const triangleTopX = radius + innerRadius * Math.cos(angle);
                    const triangleTopY = radius + innerRadius * Math.sin(angle);
                    const p1x = radius + innerRadius * Math.cos(angle + (2 * Math.PI) / 3);
                    const p1y = radius + innerRadius * Math.sin(angle + (2 * Math.PI) / 3);
                    const p2x = radius + innerRadius * Math.cos(angle - (2 * Math.PI) / 3);
                    const p2y = radius + innerRadius * Math.sin(angle - (2 * Math.PI) / 3);

                    drawTriangleWithRadialGradients(
                        ctx,
                        triangleTopX,
                        triangleTopY,
                        p1x,
                        p1y,
                        p2x,
                        p2y,
                        selectedColor,
                    );

                    drawHandleIndicator(
                        ctx,
                        triangleHandlePosition.x,
                        triangleHandlePosition.y,
                    );

                    const imageData = ctx.getImageData(
                        triangleHandlePosition.x,
                        triangleHandlePosition.y,
                        1,
                        1,
                    ).data;
                    const [r, g, b, a] = imageData;
                    if (a !== 0) {
                        setSelectedTriangleColor(`rgb(${r}, ${g}, ${b})`);
                    }
                }
            }
        }
    }, [handlePosition, triangleHandlePosition, selectedColor]);

    const drawTriangleWithRadialGradients = (
        ctx: CanvasRenderingContext2D,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        color: string,
    ) => {
        const drawRadialGradient = (x: number, y: number, color: string) => {
            const radius = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, "transparent");

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        };

        drawRadialGradient(x1, y1, "white");
        drawRadialGradient(x2, y2, "white");
        drawRadialGradient(x3, y3, color);
    };

    const drawHandleIndicator = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
    ) => {
        ctx.beginPath();
        ctx.arc(x, y, handleRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
    };

    const handleColorPick = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    ) => {
        const canvas = colorPickerRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                const imageData = ctx.getImageData(x, y, 1, 1).data;
                const [r, g, b, a] = imageData;
                if (a !== 0) {
                    if (isInsideTriangle(x, y)) {
                        setSelectedTriangleColor(`rgb(${r}, ${g}, ${b})`);
                    } else {
                        setSelectedColor(`rgb(${r}, ${g}, ${b})`);
                        const angle = Math.atan2(
                            y - canvas.height / 2,
                            x - canvas.width / 2,
                        );
                        const newPosition = angleToHandlePosition(angle, canvas.width / 2);
                        setHandlePosition(constrainToDoughnut(newPosition));
                    }
                }
            }
        }
    };

    const isInsideTriangle = (x: number, y: number) => {
        const canvas = colorPickerRef.current;
        if (canvas) {
            const radius = canvas.width / 2;
            const innerRadius = radius - doughnutThickness / 2;
            const angle = handlePositionToAngle(handlePosition, radius) + rotationAngle;
            const p0 = {
                x: radius + innerRadius * Math.cos(angle),
                y: radius + innerRadius * Math.sin(angle),
            };
            const p1 = {
                x: radius + innerRadius * Math.cos(angle + (2 * Math.PI) / 3),
                y: radius + innerRadius * Math.sin(angle + (2 * Math.PI) / 3),
            };
            const p2 = {
                x: radius + innerRadius * Math.cos(angle - (2 * Math.PI) / 3),
                y: radius + innerRadius * Math.sin(angle - (2 * Math.PI) / 3),
            };

            const area =
                0.5 *
                (-p1.y * p2.x +
                    p0.y * (-p1.x + p2.x) +
                    p0.x * (p1.y - p2.y) +
                    p1.x * p2.y);
            const s =
                (1 / (2 * area)) *
                (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * x + (p0.x - p2.x) * y);
            const t =
                (1 / (2 * area)) *
                (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * x + (p1.x - p0.x) * y);

            return s >= 0 && t >= 0 && 1 - s - t >= 0;
        }
        return false;
    };

    const handleMouseDown = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    ) => {
        const canvas = colorPickerRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (isInsideTriangle(x, y)) {
                setIsDraggingTriangle(true);
            } else {
                setIsDragging(true);
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsDraggingTriangle(false);
    };

    const handleMouseMove = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>,
    ) => {
        const canvas = colorPickerRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (isDragging) {
                const angle = Math.atan2(y - canvas.height / 2, x - canvas.width / 2);
                const newPosition = angleToHandlePosition(angle, canvas.width / 2);
                setHandlePosition(constrainToDoughnut(newPosition));
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    const imageData = ctx.getImageData(
                        newPosition.x,
                        newPosition.y,
                        1,
                        1,
                    ).data;
                    const [r, g, b, a] = imageData;
                    if (a !== 0) {
                        setSelectedColor(`rgb(${r}, ${g}, ${b})`);
                    }
                }
            } else if (isDraggingTriangle) {
                const x = e.clientX - canvas.getBoundingClientRect().left;
                const y = e.clientY - canvas.getBoundingClientRect().top;
                if (isInsideTriangle(x, y)) {
                    setTriangleHandlePosition({ x, y });
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        const imageData = ctx.getImageData(x, y, 1, 1).data;
                        const [r, g, b, a] = imageData;
                        if (a !== 0) {
                            setSelectedTriangleColor(`rgb(${r}, ${g}, ${b})`);
                        }
                    }
                }
            }
        }
    };

    const angleToHandlePosition = (angle: number, radius: number) => {
        const x = radius + (radius - doughnutThickness / 2) * Math.cos(angle);
        const y = radius + (radius - doughnutThickness / 2) * Math.sin(angle);
        return { x, y };
    };

    const handlePositionToAngle = (
        position: { x: number; y: number },
        radius: number,
    ) => {
        const dx = position.x - radius;
        const dy = position.y - radius;
        return Math.atan2(dy, dx);
    };

    const constrainToDoughnut = (position: { x: number; y: number }) => {
        const canvas = colorPickerRef.current;
        if (canvas) {
            const radius = canvas.width / 2;
            const distance = Math.sqrt(
                Math.pow(position.x - radius, 2) + Math.pow(position.y - radius, 2),
            );
            if (distance < radius - doughnutThickness / 2 || distance > radius) {
                return handlePosition;
            }
        }
        return position;
    };

    return (
        <div className={styles.pickerContainer}>
            <div className={styles.title}>Colors</div>
            <canvas
                ref={colorPickerRef}
                width="200"
                height="200"
                className={styles.colorPicker}
                onClick={handleColorPick}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            />
            <div className={styles.selectedTriangleColor}>
                {selectedTriangleColor}
            </div>
            <div className={styles.recentColours}>
                <div
                    className={styles.colorBox}
                    style={{ backgroundColor: selectedTriangleColor }}
                ></div>
                <div className={styles.colorBox}></div>
                <div className={styles.colorBox}></div>
                <div className={styles.colorBox}></div>
                <div className={styles.colorBox}></div>
                <div className={styles.colorBox}></div>
                <div className={styles.colorBox}></div>
                <div className={styles.colorBox}></div>
                <div className={styles.colorBox}></div>
            </div>
        </div>
    );
};

export default ColorPicker;
