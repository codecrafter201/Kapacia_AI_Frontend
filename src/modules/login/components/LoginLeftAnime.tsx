const LoginLeftAnime = () => {
  return (
    <div className="relative flex flex-col justify-center items-center p-6 w-full h-full">
      <img
        src="/images/auth/login.png"
        width={800}
        height={600}
        alt="Kapacia Ai Logo"
        className="w-full h-auto"
      />
    </div>
  );
};

export default LoginLeftAnime;

// import { motion } from "framer-motion";

// const LoginLeftAnime = () => {
//   return (
//     <div
//       className="relative flex justify-center items-center w-full h-full"
//       style={{ perspective: "1000px" }} // REQUIRED for Z axis
//     >
//       {/* Blue blurred shape */}
//       <motion.div
//         className="absolute rounded-full"
//         style={{
//           width: "109px",
//           height: "237px",
//           backgroundColor: "#67B5F9",
//           filter: "blur(20px)",
//           opacity: 0.5,
//         }}
//         animate={{
//           x: [-20, 20, -20],
//           y: [0, -30, 0],
//           z: [0, 60, 0],
//           rotateX: [0, 25, 0],
//           rotateY: [0, -25, 0],
//           rotateZ: [-72.56, -50, -72.56],
//         }}
//         transition={{
//           duration: 11,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//       />

//       {/* Gradient blurred shape */}
//       <motion.div
//         className="absolute rounded-full"
//         style={{
//           width: "108px",
//           height: "221px",
//           background: "linear-gradient(135deg, #FFEBBD, #CAFFA0)",
//           filter: "blur(20px)",
//           opacity: 0.6,
//         }}
//         animate={{
//           x: [30, -30, 30],
//           y: [0, 25, 0],
//           z: [0, -80, 0],
//           rotateX: [0, -20, 0],
//           rotateY: [0, 20, 0],
//           rotateZ: [-15.77, 10, -15.77],
//         }}
//         transition={{
//           duration: 11,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//       />

//       {/* Main floating image */}
//       <motion.img
//         src="/images/auth/login.png"
//         alt="Kapacia Ai Logo"
//         className="z-10 relative w-full h-auto"
//         animate={{
//           x: [0, 10, -10, 0],
//           y: [0, -15, 0],
//           z: [0, 40, 0],
//           rotateX: [0, 8, 0],
//           rotateY: [0, -8, 0],
//         }}
//         transition={{
//           duration: 13,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//       />
//     </div>
//   );
// };

// export default LoginLeftAnime;
