import React from "react";
import C3 from "../assets/C3.png";
import C1 from "../assets/C1.png";
import C2 from "../assets/C2.png";
import C4 from "../assets/C4.svg";
import C5 from "../assets/C5.png";
import C6 from "../assets/C6.png";
import C7 from "../assets/C7.svg";
import { certificationStyles } from "../assets/dummyStyles";

const Certification = () => {

  const certifications = [
    { id: 1, name: "Medical Commission", image: C1 },
    { id: 2, name: "Government Approved", image: C2 },
    { id: 3, name: "NABH Accredited", image: C3 },
    { id: 4, name: "Medical Council", image: C4 },
    { id: 5, name: "Quality Healthcare", image: C5 },
    { id: 6, name: "Paramedical Council", image: C6 },
    { id: 7, name: "Ministry of Health", image: C7 }
  ];

  const duplicatedCertifications = [
    ...certifications,
    ...certifications,
    ...certifications
  ];

  return (
   <div className={`${certificationStyles.container} min-h-[400px] relative mt-16`}>

      {/* Background Grid */}
      <div className={certificationStyles.backgroundGrid}>
        <div className={certificationStyles.topLine}></div>

        <div className={certificationStyles.gridContainer}>
          <div className={certificationStyles.grid}>
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className={certificationStyles.gridCell}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Wrapper */}
      <div className={certificationStyles.contentWrapper}>

        {/* Heading */}
        <div className={certificationStyles.headingContainer}>
          <div className={certificationStyles.headingInner}>

            <div className={certificationStyles.leftLine}></div>
            <div className={certificationStyles.rightLine}></div>

            <h2 className={certificationStyles.title}>
              <span className={certificationStyles.titleText}>
                CERTIFIED & EXCELLENCE
              </span>
            </h2>

          </div>

          <p className={certificationStyles.subtitle}>
            Government recognized and internationally accredited healthcare standards
          </p>

          <div className={certificationStyles.badgeContainer}>
            <div className={certificationStyles.badgeDot}></div>
            <span className={certificationStyles.badgeText}>
                OFFICIALLY CERTIFIED
            </span>
          </div>
        </div>

        <div className={certificationStyles.logosContainer}>
            <div className={certificationStyles.logosInner}>
                <div className={certificationStyles.logosFlexContainer}>
                    <div className={certificationStyles.logosMarquee}>
                        {duplicatedCertifications.map((cert,index)=> (
                            <div key={`cert-${cert.id}-${index}`}
                            className={certificationStyles.logoItem}>
                                <div className="relative">
                                    <img src={cert.image} alt={cert.alt} className={certificationStyles.logoImage} />
                                    
                                </div>
                                <span className={certificationStyles.logoText}>
                                    {cert.name}
                                </span>
                                </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>

      </div>
      <style>{certificationStyles.animationStyles}</style>
      
    </div>
  );
};

export default Certification;