"""
Build sampleData.js from raw PubMed and Consensus search results.
Run once to generate the fallback dataset for the Research Gap Finder demo.
"""
import json

# ============================================================
# RAW DATA — curated from PubMed + Consensus searches
# ============================================================

# Topic 1: AI in Surgical Outcomes Prediction
surgery_papers = [
    {
        "id": "pmid_37208107",
        "title": "Artificial intelligence, machine learning, and deep learning in liver transplantation",
        "authors": ["Bhat M", "Rabindranath M", "Chara BS", "Simonetto DA"],
        "journal": "Journal of Hepatology",
        "year": 2023,
        "abstract": "Liver transplantation (LT) is a life-saving treatment for individuals with end-stage liver disease. The management of LT recipients is complex, predominantly because of the need to consider demographic, clinical, laboratory, pathology, imaging, and omics data in the development of an appropriate treatment plan. Current methods to collate clinical information are susceptible to some degree of subjectivity; thus, clinical decision-making in LT could benefit from the data-driven approach offered by artificial intelligence (AI). Machine learning and deep learning could be applied in both the pre- and post-LT settings. Some examples of AI applications pre-transplant include optimising transplant candidacy decision-making and donor-recipient matching to reduce waitlist mortality and improve post-transplant outcomes.",
        "url": "https://doi.org/10.1016/j.jhep.2023.01.006",
        "pmid": "37208107",
        "source": "pubmed",
        "keywords": ["liver graft", "survival", "transplantation", "waitlist mortality", "machine learning", "deep learning"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_38353755",
        "title": "Artificial Intelligence in Operating Room Management",
        "authors": ["Bellini V", "Russo M", "Domenichetti T", "Panizzi M", "Allai S", "Bignami EG"],
        "journal": "Journal of Medical Systems",
        "year": 2024,
        "abstract": "This systematic review examines the recent use of artificial intelligence, particularly machine learning, in the management of operating rooms. A total of 22 selected studies from February 2019 to September 2023 are analyzed. The review emphasizes the significant impact of AI on predicting surgical case durations, optimizing post-anesthesia care unit resource allocation, and detecting surgical case cancellations. Machine learning algorithms such as XGBoost, random forest, and neural networks have demonstrated their effectiveness in improving prediction accuracy and resource utilization.",
        "url": "https://doi.org/10.1007/s10916-024-02038-2",
        "pmid": "38353755",
        "source": "pubmed",
        "keywords": ["artificial intelligence", "machine learning", "management", "operating room", "perioperative"],
        "citationCount": None,
        "fullTextAvailable": True
    },
    {
        "id": "pmid_32736589",
        "title": "Prediction of the development of acute kidney injury following cardiac surgery by machine learning",
        "authors": ["Tseng PY", "Chen YT", "Wang CH", "Chiu KM", "Peng YS", "Hsu SP", "Chen KL", "Yang CY", "Lee OK"],
        "journal": "Critical Care",
        "year": 2020,
        "abstract": "Cardiac surgery-associated acute kidney injury (CSA-AKI) is a major complication that results in increased morbidity and mortality after cardiac surgery. This study utilized an artificial intelligence-based machine learning approach thorough perioperative data-driven learning to predict CSA-AKI. Development of CSA-AKI was noted in 163 patients (24.3%) during the first postoperative week. The ensemble model (RF + XGboost) exhibited the greatest AUC (0.843). The top 3 most influential features were intraoperative urine output, units of packed red blood cells transfused during surgery, and preoperative hemoglobin level.",
        "url": "https://doi.org/10.1186/s13054-020-03179-9",
        "pmid": "32736589",
        "source": "pubmed",
        "keywords": ["acute kidney injury", "cardiac surgery", "machine learning", "prediction", "XGBoost"],
        "citationCount": None,
        "fullTextAvailable": True
    },
    {
        "id": "pmid_31001455",
        "title": "Explainable machine-learning predictions for the prevention of hypoxaemia during surgery",
        "authors": ["Lundberg SM", "Nair B", "Vavilala MS", "Horibe M", "Eisses MJ", "Adams T", "Liston DE", "Low DK", "Newman SF", "Kim J", "Lee SI"],
        "journal": "Nature Biomedical Engineering",
        "year": 2018,
        "abstract": "Although anaesthesiologists strive to avoid hypoxemia during surgery, reliably predicting future intraoperative hypoxemia is not currently possible. Here, we report the development and testing of a machine-learning-based system that, in real time during general anaesthesia, predicts the risk of hypoxemia and provides explanations of the risk factors. The system was trained on minute-by-minute data from the electronic medical records of over fifty thousand surgeries. Our results suggest that if anaesthesiologists currently anticipate 15% of hypoxemia events, with this system's assistance they would anticipate 30% of them.",
        "url": "https://doi.org/10.1038/s41551-018-0304-0",
        "pmid": "31001455",
        "source": "pubmed",
        "keywords": ["explainable AI", "hypoxemia", "anesthesia", "SHAP", "real-time prediction", "surgery"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_33848833",
        "title": "Machine Learning and Surgical Outcomes Prediction: A Systematic Review",
        "authors": ["Elfanagely O", "Toyoda Y", "Othman S", "Mellia JA", "Basta M", "Liu T", "Kording K", "Ungar L", "Fischer JP"],
        "journal": "The Journal of Surgical Research",
        "year": 2021,
        "abstract": "Machine learning (ML) has garnered increasing attention as a means to quantitatively analyze the growing and complex medical data to improve individualized patient care. Of the initial 2677 studies, 45 papers met inclusion criteria. Fourteen different subspecialties were represented with neurosurgery being most common. The most frequently used ML algorithms were random forest (n=19), artificial neural network (n=17), and logistic regression (n=17). All studies which compared ML algorithms to conventional studies found improved outcome prediction with ML models. Limitations included heterogeneous outcome and imperfect quality of some of the papers.",
        "url": "https://doi.org/10.1016/j.jss.2021.02.045",
        "pmid": "33848833",
        "source": "pubmed",
        "keywords": ["artificial intelligence", "machine learning", "surgical outcomes", "systematic review", "natural language processing"],
        "citationCount": 85,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_39172864",
        "title": "Utility of Machine Learning, Natural Language Processing, and Artificial Intelligence in Predicting Hospital Readmissions After Orthopaedic Surgery: A Systematic Review and Meta-Analysis",
        "authors": ["Fares MY", "Liu HH", "da Silva Etges APB", "Zhang B", "Warner JJP", "Olson JJ", "Fedorka CJ", "Khan AZ", "Best MJ"],
        "journal": "JBJS Reviews",
        "year": 2024,
        "abstract": "A total of 26 studies were included. The overall summary C-statistic showed a mean of 0.71 across all models, indicating a reasonable level of predictiveness. Models predicting readmissions after hip/knee arthroplasty procedures had a higher prediction accuracy (mean C-statistic = 0.79) than spine (0.7) and shoulder (0.67). Models that used single institution data and included intraoperative and/or postoperative outcomes had higher mean C-statistics. According to PROBAST, the majority of articles had a high risk of bias.",
        "url": "https://doi.org/10.2106/JBJS.RVW.24.00075",
        "pmid": "39172864",
        "source": "pubmed",
        "keywords": ["machine learning", "NLP", "readmissions", "orthopaedic surgery", "meta-analysis"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_35719121",
        "title": "Machine learning and artificial intelligence in cardiac transplantation: A systematic review",
        "authors": ["Naruka V", "Arjomandi Rad A", "Subbiah Ponniah H", "Francis J", "Vardanyan R", "Tasoudis P", "Magouliotis DE", "Lazopoulos GL", "Salmasi MY", "Athanasiou T"],
        "journal": "Artificial Organs",
        "year": 2022,
        "abstract": "Our search yielded 237 articles, of which 13 studies were included, featuring 463,850 patients. Three main areas of application were identified: ML for predictive modeling of heart transplantation mortality outcomes; ML in graft failure outcomes; ML to aid imaging in heart transplantation. The results suggest that AI and ML are more accurate in predicting graft failure and mortality than traditional scoring systems and conventional regression analysis.",
        "url": "https://doi.org/10.1111/aor.14334",
        "pmid": "35719121",
        "source": "pubmed",
        "keywords": ["artificial intelligence", "cardiac transplantation", "heart transplantation", "machine learning", "graft failure"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_40398559",
        "title": "Utilizing Artificial Intelligence: Machine Learning Algorithms to Develop a Preoperative Endometriosis Prediction Model",
        "authors": ["Snyder DL", "Sidhom S", "Chatham CE", "Tillotson SG", "Zapata RD", "Modave F", "Solly M", "Quevedo A", "Moawad NS"],
        "journal": "Journal of Minimally Invasive Gynecology",
        "year": 2025,
        "abstract": "Among 788 participants, 654 (83%) had pathology-confirmed endometriosis. The MLA extreme gradient boosting achieved an accuracy of 83%, sensitivity of 96%, and AUC of 0.81. SHAP analysis identified key predictors including emesis, crampy pain, regular periods, severity of dysmenorrhea, and retrocervical tenderness on rectovaginal exam. This study demonstrates that MLAs have potential to predict endometriosis preoperatively utilizing clinical features.",
        "url": "https://doi.org/10.1016/j.jmig.2025.05.003",
        "pmid": "40398559",
        "source": "pubmed",
        "keywords": ["artificial intelligence", "laparoscopy", "machine learning", "prediction model", "endometriosis"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_surgery_1",
        "title": "Comprehensive overview of artificial intelligence in surgery: a systematic review and perspectives",
        "authors": ["Chevalier O"],
        "journal": "Pflügers Archiv - European Journal of Physiology",
        "year": 2025,
        "abstract": "The rapid integration of artificial intelligence (AI) into surgical practice necessitates a comprehensive evaluation of its applications, challenges, and physiological impact. This systematic review synthesizes current AI applications in surgery, with a particular focus on machine learning and its role in optimizing preoperative planning, intraoperative decision-making, and postoperative patient management. We conclude that longitudinal validation, improved AI explainability, and adaptive regulatory frameworks are essential to ensure safe, effective integration of AI into surgical decision-making.",
        "url": "https://consensus.app/papers/details/18dd0bc6403557d7b0d14c598b691e7d/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["artificial intelligence", "surgery", "explainability", "preoperative planning", "intraoperative decision-making"],
        "citationCount": 4,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_surgery_2",
        "title": "Artificial Intelligence for Hip Fracture Detection and Outcome Prediction",
        "authors": ["Lex J"],
        "journal": "JAMA Network Open",
        "year": 2023,
        "abstract": "Of 39 studies included, 18 used AI models to diagnose hip fractures on plain radiographs and 21 used AI models to predict patient outcomes following hip fracture surgery. A total of 39,598 plain radiographs and 714,939 hip fractures were used. Mortality and length of hospital stay were the most predicted outcomes. The performance of AI in diagnosing hip fractures was comparable with that of expert radiologists and surgeons. However, current implementations of AI for outcome prediction do not seem to provide substantial benefit over traditional multivariable predictive statistics.",
        "url": "https://consensus.app/papers/details/a4ea9c710e07549f922aae7de2846458/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["hip fracture", "outcome prediction", "diagnosis", "radiograph", "mortality"],
        "citationCount": 53,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_surgery_3",
        "title": "A systematic review on artificial intelligence in robot-assisted surgery",
        "authors": ["Moglia A"],
        "journal": "International Journal of Surgery",
        "year": 2021,
        "abstract": "Thirty-five publications representing 3436 patients met the search criteria. The selected reports concern: motion analysis (n=17), urology (n=12), gynecology (n=1), other specialties (n=1), training (n=3), and tissue retraction (n=1). There is no proof that currently AI can identify the critical tasks of RAS operations which determine patient outcome. There is an urgent need for studies on large datasets and external validation of the AI algorithms used.",
        "url": "https://consensus.app/papers/details/a4df919f48bc5a4884220a325802f188/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["robot-assisted surgery", "motion analysis", "urology", "external validation"],
        "citationCount": 133,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_surgery_4",
        "title": "The prediction of surgical complications using artificial intelligence in patients undergoing major abdominal surgery: A systematic review",
        "authors": ["Stam WT"],
        "journal": "Surgery",
        "year": 2021,
        "abstract": "From a total of 1,537 identified articles, 15 were included. Among a large variety of algorithms, sensitivity was between 0.06 and 0.96, specificity between 0.61 and 0.98, accuracy between 0.78 and 0.95, and AUC varied between 0.50 and 0.96. AI algorithms have the ability to accurately predict postoperative complications. Nevertheless, algorithms should be properly tested and validated, both internally and externally.",
        "url": "https://consensus.app/papers/details/c53b9baed50f514a840f018c1cbff1a3/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["surgical complications", "abdominal surgery", "prediction", "validation"],
        "citationCount": 62,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_surgery_5",
        "title": "The State of Artificial Intelligence in Pediatric Surgery: A Systematic Review",
        "authors": ["Elahmedi M"],
        "journal": "Journal of Pediatric Surgery",
        "year": 2024,
        "abstract": "Authors screened 8178 articles and included 112. Half of the studies (50%) reported predictive models (for adverse events 25%, surgical outcomes 16% and survival 9%), followed by diagnostic (29%) and decision support models (21%). Neural networks (44%) and ensemble learners (36%) were the most commonly used AI methods. Forty-four percent of models were interpretable, and 6% were both interpretable and externally validated. Forty percent of models had a high risk of bias.",
        "url": "https://consensus.app/papers/details/f98c9d0042ca530ab7d00c2f083e2e9f/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["pediatric surgery", "neural networks", "ensemble learners", "interpretability", "bias"],
        "citationCount": 11,
        "fullTextAvailable": False
    }
]

# Topic 2: AI in Radiology / Diagnostic Imaging
radiology_papers = [
    {
        "id": "pmid_31857130",
        "title": "Artificial intelligence in medical imaging",
        "authors": ["Gore JC"],
        "journal": "Magnetic Resonance Imaging",
        "year": 2019,
        "abstract": "The medical specialty radiology has experienced extremely important and influential technical developments. Artificial intelligence (AI) is potentially another such development that will introduce fundamental changes into the practice of radiology. Potential new capabilities provided by AI offer exciting prospects for more efficient and effective use of medical images.",
        "url": "https://doi.org/10.1016/j.mri.2019.12.006",
        "pmid": "31857130",
        "source": "pubmed",
        "keywords": ["artificial intelligence", "deep learning", "radiology", "diagnostic imaging"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_36350524",
        "title": "Artificial intelligence in lung cancer: current applications and perspectives",
        "authors": ["Chassagnon G", "De Margerie-Mellon C", "Vakalopoulou M", "Marini R", "Hoang-Thi TN", "Revel MP", "Soyer P"],
        "journal": "Japanese Journal of Radiology",
        "year": 2022,
        "abstract": "Computer-aided detection tools have been commercially available since the early 2000s. The more recent rise of deep learning and the availability of large annotated lung nodule datasets have allowed the development of new CADe tools with fewer false-positive results. Classical machine learning and deep-learning methods were also used for pulmonary nodule segmentation and characterization. Data from the NLST allowed the development of several CADx tools for diagnosing lung cancer on chest CT.",
        "url": "https://doi.org/10.1007/s11604-022-01359-x",
        "pmid": "36350524",
        "source": "pubmed",
        "keywords": ["artificial intelligence", "deep learning", "lung neoplasms", "CT", "nodule detection"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_33987993",
        "title": "Deep Learning-Based Artificial Intelligence for Mammography",
        "authors": ["Yoon JH", "Kim EK"],
        "journal": "Korean Journal of Radiology",
        "year": 2021,
        "abstract": "With the application of deep learning technology, AI-based algorithms for mammography have shown promising results in the quantitative assessment of parenchymal density, detection and diagnosis of breast cancer, and prediction of breast cancer risk, enabling more precise patient management. AI-based algorithms may also enhance the efficiency of the interpretation workflow by reducing both the workload and interpretation time.",
        "url": "https://doi.org/10.3348/kjr.2020.1210",
        "pmid": "33987993",
        "source": "pubmed",
        "keywords": ["artificial intelligence", "breast cancer", "computer-aided diagnosis", "deep learning", "mammography"],
        "citationCount": None,
        "fullTextAvailable": True
    },
    {
        "id": "pmid_31841881",
        "title": "Artificial intelligence applications for thoracic imaging",
        "authors": ["Chassagnon G", "Vakalopoulou M", "Paragios N", "Revel MP"],
        "journal": "European Journal of Radiology",
        "year": 2019,
        "abstract": "Multiple usages are currently being evaluated for thoracic imaging including lung nodule evaluation, tuberculosis or pneumonia detection or quantification of diffuse lung diseases. Current algorithms are able to detect up to 14 common anomalies when present as isolated findings. Prospective validation of AI tools will be required before reaching routine clinical implementation.",
        "url": "https://doi.org/10.1016/j.ejrad.2019.108774",
        "pmid": "31841881",
        "source": "pubmed",
        "keywords": ["artificial intelligence", "deep learning", "machine learning", "thoracic imaging", "chest radiography"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_38402191",
        "title": "Artificial intelligence for radiographic imaging detection of caries lesions: a systematic review",
        "authors": ["Albano D", "Galiano V", "Basile M", "Di Luca F", "Gitto S", "Messina C", "Cagetti MG", "Del Fabbro M", "Tartaglia GM", "Sconfienza LM"],
        "journal": "BMC Oral Health",
        "year": 2024,
        "abstract": "Twenty articles that met the selection criteria were evaluated. The diagnostic performance achieved in detecting caries lesions: sensitivity from 0.44 to 0.86, specificity from 0.85 to 0.98, accuracy from 0.73 to 0.98, AUC from 0.84 to 0.98. AI-based models have demonstrated good diagnostic performance, potentially being an important aid in caries lesion detection. Some limitations relate to the size and heterogeneity of the datasets.",
        "url": "https://doi.org/10.1186/s12903-024-04046-7",
        "pmid": "38402191",
        "source": "pubmed",
        "keywords": ["artificial intelligence", "caries lesion", "detection", "diagnosis", "radiographic imaging"],
        "citationCount": None,
        "fullTextAvailable": True
    },
    {
        "id": "consensus_rad_1",
        "title": "Radiology artificial intelligence: a systematic review and evaluation of methods (RAISE)",
        "authors": ["Kelly B"],
        "journal": "European Radiology",
        "year": 2022,
        "abstract": "Seven hundred sixty-seven full texts were reviewed, and 535 articles were included. Ninety-eight percent were retrospective cohort studies. The median number of patients included was 460. Most studies involved MRI (37%). Neuroradiology was the most common subspecialty. Of the 77 studies that externally validated their results, performance on average decreased by 6% at external validation. The literature is dominated by retrospective cohort studies with limited external validation with high potential for bias.",
        "url": "https://consensus.app/papers/details/978ab093f41b5a218bdab126f51896bd/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["systematic review", "deep learning", "radiology", "external validation", "bias"],
        "citationCount": 164,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_rad_2",
        "title": "A Roadmap for Foundational Research on Artificial Intelligence in Medical Imaging: From the 2018 NIH/RSNA/ACR/The Academy Workshop",
        "authors": ["Langlotz C"],
        "journal": "Radiology",
        "year": 2019,
        "abstract": "Key research priorities include: new image reconstruction methods, automated image labeling and annotation methods, new machine learning methods for clinical imaging data such as tailored pretrained model architectures and federated machine learning methods, explainable AI methods, and validated methods for image de-identification and data sharing to facilitate wide availability of clinical imaging data sets.",
        "url": "https://consensus.app/papers/details/32734298f6ee5dd3a54d939a42498c5c/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["roadmap", "NIH", "RSNA", "federated learning", "explainable AI", "data sharing"],
        "citationCount": 300,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_rad_3",
        "title": "AI in Diagnostic Imaging: Revolutionising Accuracy and Efficiency",
        "authors": ["Khalifa M"],
        "journal": "Computer Methods and Programs in Biomedicine Update",
        "year": 2024,
        "abstract": "Through 30 included studies, the review identifies four AI domains and eight functions in diagnostic imaging: Image Analysis and Interpretation, Operational Efficiency, Predictive and Personalised Healthcare, and Clinical Decision Support. AI assists in complex procedures by providing precise imaging support and integrates with other technologies like EHRs for enriched health insights. Challenges include ethical concerns, data privacy, and the need for technology investments and training.",
        "url": "https://consensus.app/papers/details/49ede240b5815f7d9d58da923d6a50dc/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["diagnostic imaging", "accuracy", "efficiency", "personalized medicine", "clinical decision support"],
        "citationCount": 221,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_rad_4",
        "title": "Redefining Radiology: A Review of Artificial Intelligence Integration in Medical Imaging",
        "authors": ["Najjar R"],
        "journal": "Diagnostics",
        "year": 2023,
        "abstract": "This comprehensive review traces the evolution of radiology, from the initial discovery of X-rays to the application of ML and deep learning in modern medical image analysis. The primary focus is on AI applications in image segmentation, computer-aided diagnosis, predictive analytics, and workflow optimisation. The integration of AI in radiology is not devoid of challenges: data quality, the 'black box' enigma, infrastructural complexities, and ethical implications.",
        "url": "https://consensus.app/papers/details/94e5df81e2e2581e8d01ae93dccae204/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["radiology", "image segmentation", "computer-aided diagnosis", "black box", "workflow optimization"],
        "citationCount": 455,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_rad_5",
        "title": "Heterogeneity and predictors of the effects of AI assistance on radiologists",
        "authors": ["Yu F"],
        "journal": "Nature Medicine",
        "year": 2024,
        "abstract": "This large-scale study examined the heterogeneous effects of AI assistance on 140 radiologists across 15 chest X-ray diagnostic tasks. Surprisingly, conventional experience-based factors such as years of experience, subspecialty and familiarity with AI tools fail to reliably predict the impact of AI assistance. Lower-performing radiologists do not consistently benefit more from AI assistance. Instead, the occurrence of AI errors strongly influences treatment outcomes, with inaccurate AI predictions adversely affecting radiologist performance.",
        "url": "https://consensus.app/papers/details/610e097be6a15a8395bb4e0ff51813d7/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["AI assistance", "radiologists", "heterogeneity", "AI errors", "chest X-ray", "clinical collaboration"],
        "citationCount": 99,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_rad_6",
        "title": "Explainable artificial intelligence (XAI) in radiology and nuclear medicine: a literature review",
        "authors": ["de Vries BM"],
        "journal": "Frontiers in Medicine",
        "year": 2023,
        "abstract": "A total of 75 articles were included. Major variations in performance is seen between the methods. Overall, post-hoc XAI lacks the ability to provide class-discriminative and target-specific explanation. Ante-hoc XAI seems to tackle this because of its intrinsic ability to explain. However, quality control of the XAI methods is rarely applied. There is currently no clear consensus on how XAI should be deployed to close the gap between medical professionals and DL algorithms.",
        "url": "https://consensus.app/papers/details/76a3f3beb7e751a2975b1e60d8e9a664/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["explainable AI", "XAI", "radiology", "nuclear medicine", "quality control"],
        "citationCount": 67,
        "fullTextAvailable": False
    },
    {
        "id": "consensus_rad_7",
        "title": "Predicting cancer outcomes with radiomics and artificial intelligence in radiology",
        "authors": ["Bera K"],
        "journal": "Nature Reviews Clinical Oncology",
        "year": 2021,
        "abstract": "We discuss the next generation of challenges in clinical decision-making that AI tools can solve using radiology images: prognostication of outcome across multiple cancers, prediction of response to various treatment modalities, discrimination of benign treatment confounders from true progression, identification of unusual response patterns and prediction of the mutational and molecular profile of tumours. We also address challenges on the path to clinical adoption including data curation, interpretability, and regulatory and reimbursement issues.",
        "url": "https://consensus.app/papers/details/994f2c672e215530a4e0ced17dcddaf2/",
        "pmid": None,
        "source": "scholar",
        "keywords": ["radiomics", "cancer outcomes", "treatment response", "molecular profiling", "regulatory"],
        "citationCount": 546,
        "fullTextAvailable": False
    }
]

# Topic 3: LLMs in Clinical Decision Support
llm_papers = [
    {
        "id": "pmid_40055694",
        "title": "A systematic review of large language model (LLM) evaluations in clinical medicine",
        "authors": ["Shool S", "Adimi S", "Saboori Amleshi R", "Bitaraf E", "Golpira R", "Tara M"],
        "journal": "BMC Medical Informatics and Decision Making",
        "year": 2025,
        "abstract": "The results reveal a growing interest in leveraging LLM tools in clinical settings, with 761 studies meeting the inclusion criteria. While general-domain LLMs, particularly ChatGPT and GPT-4, dominated evaluations (93.55%), medical-domain LLMs accounted for only 6.45%. Accuracy emerged as the most commonly assessed parameter (21.78%). The evidence base highlights certain limitations and biases across the included studies, emphasizing the need for careful interpretation and robust evaluation frameworks.",
        "url": "https://doi.org/10.1186/s12911-025-02954-4",
        "pmid": "40055694",
        "source": "pubmed",
        "keywords": ["large language models", "clinical medicine", "LLM evaluation", "systematic review", "deep learning in healthcare"],
        "citationCount": None,
        "fullTextAvailable": True
    },
    {
        "id": "pmid_40267970",
        "title": "Benchmark evaluation of DeepSeek large language models in clinical decision-making",
        "authors": ["Sandmann S", "Hegselmann S", "Fujarski M", "Bickmann L", "Wild B", "Eils R", "Varghese J"],
        "journal": "Nature Medicine",
        "year": 2025,
        "abstract": "Large language models are increasingly transforming medical applications. However, proprietary models such as GPT-4o face significant barriers to clinical adoption because they cannot be deployed on hospital infrastructure, raising concerns about data privacy and regulatory compliance. DeepSeek models offer open-source alternatives that can be deployed locally. This benchmark evaluation compares DeepSeek models against proprietary alternatives across multiple clinical decision-making tasks.",
        "url": "https://doi.org/10.1038/s41591-025-03727-2",
        "pmid": "40267970",
        "source": "pubmed",
        "keywords": ["DeepSeek", "large language models", "clinical decision-making", "benchmark", "open-source", "data privacy"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_39475661",
        "title": "Expert-Guided Large Language Models for Clinical Decision Support in Precision Oncology",
        "authors": ["Lammert J", "Dreyer T", "Mathes S", "Kuligin L", "Borm KJ", "Schatz UA"],
        "journal": "JCO Precision Oncology",
        "year": 2024,
        "abstract": "Rapidly expanding medical literature challenges oncologists seeking targeted cancer therapies. General-purpose large language models lack domain-specific knowledge, limiting their clinical utility. This study develops expert-guided LLMs with domain-specific knowledge for clinical decision support in precision oncology, demonstrating improved accuracy over general-purpose models.",
        "url": "https://doi.org/10.1200/PO-24-00478",
        "pmid": "39475661",
        "source": "pubmed",
        "keywords": ["precision oncology", "expert-guided", "LLM", "domain-specific", "clinical decision support"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_40846793",
        "title": "Large language models for clinical decision support in gastroenterology and hepatology",
        "authors": ["Wiest IC", "Bhat M", "Clusmann J", "Schneider CV", "Jiang X", "Kather JN"],
        "journal": "Nature Reviews Gastroenterology & Hepatology",
        "year": 2025,
        "abstract": "Clinical decision making in gastroenterology and hepatology has become increasingly complex and challenging for physicians. This growing complexity can be addressed by computational tools that support clinical workflows. Large language models represent a promising class of AI tools for this purpose, offering natural language interaction capabilities for clinical decision support.",
        "url": "https://doi.org/10.1038/s41575-025-01108-1",
        "pmid": "40846793",
        "source": "pubmed",
        "keywords": ["large language models", "gastroenterology", "hepatology", "clinical decision support", "workflow"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_38728687",
        "title": "The Role of Large Language Models in Transforming Emergency Medicine: Scoping Review",
        "authors": ["Preiksaitis C", "Ashenburg N", "Bunney G", "Chu A", "Kabeer R", "Riley F", "Ribeira R", "Rose C"],
        "journal": "JMIR Medical Informatics",
        "year": 2024,
        "abstract": "Artificial intelligence, more specifically large language models, holds significant potential in revolutionizing emergency care delivery by optimizing clinical workflows and enhancing the quality of patient interactions. This scoping review examines LLM applications in emergency medicine including clinical decision support, communication, education, medical training, and workflow efficiency.",
        "url": "https://doi.org/10.2196/53787",
        "pmid": "38728687",
        "source": "pubmed",
        "keywords": ["LLM", "emergency medicine", "clinical decision support", "workflow efficiency", "medical education", "ChatGPT"],
        "citationCount": None,
        "fullTextAvailable": True
    },
    {
        "id": "pmid_40150453",
        "title": "A Review of Large Language Models in Medical Education, Clinical Decision Support, and Healthcare Administration",
        "authors": ["Vrdoljak J", "Boban Z", "Vilovic M", "Kumric M", "Bozic J"],
        "journal": "Healthcare",
        "year": 2025,
        "abstract": "Large language models have shown significant potential to transform various aspects of healthcare. This review explores the current applications, challenges, and future prospects of LLMs in medical education, clinical decision support, and healthcare administration. Key challenges include hallucinations, bias, data privacy, and the need for domain-specific fine-tuning.",
        "url": "https://doi.org/10.3390/healthcare13060603",
        "pmid": "40150453",
        "source": "pubmed",
        "keywords": ["large language models", "medical education", "clinical decision support", "healthcare administration", "hallucinations"],
        "citationCount": None,
        "fullTextAvailable": True
    },
    {
        "id": "pmid_39609823",
        "title": "Large language models improve clinical decision making of medical students through patient simulation and structured feedback: a randomized controlled trial",
        "authors": ["Brugge E", "Ricchizzi S", "Arenbeck M", "Keller MN", "Schur L", "Stummer W", "Holling M", "Lu MH", "Darici D"],
        "journal": "BMC Medical Education",
        "year": 2024,
        "abstract": "Clinical decision-making refers to physicians' ability to gather, evaluate, and interpret relevant diagnostic information. This RCT demonstrates that LLM-based patient simulation with structured feedback significantly improves medical students' clinical decision-making skills compared to traditional methods.",
        "url": "https://doi.org/10.1186/s12909-024-06399-7",
        "pmid": "39609823",
        "source": "pubmed",
        "keywords": ["clinical decision making", "large language models", "medical students", "patient simulation", "structured feedback", "RCT"],
        "citationCount": None,
        "fullTextAvailable": True
    },
    {
        "id": "pmid_41274285",
        "title": "Multi-center benchmarking of large language models for clinical decision support in lung cancer screening",
        "authors": ["Duan Z", "Huang X", "Lu R", "Xu W", "Liu H", "Geng Y", "Takahashi N", "Wu Y", "Wang Q", "Song Y"],
        "journal": "Cell Reports Medicine",
        "year": 2025,
        "abstract": "Large language models are increasingly explored for clinical applications, but their ability to generate management recommendations for lung cancer screening remains uncertain. This cross-sectional multi-center benchmarking study evaluates multiple LLMs' capabilities in providing clinical decision support for lung cancer screening scenarios.",
        "url": "https://doi.org/10.1016/j.xcrm.2025.102465",
        "pmid": "41274285",
        "source": "pubmed",
        "keywords": ["LLMs", "lung cancer screening", "clinical decision support", "benchmarking", "multi-center"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_39176924",
        "title": "Measured Performance and Healthcare Professional Perception of Large Language Models Used as Clinical Decision Support Systems: A Scoping Review",
        "authors": ["Delourme S", "Redjdal A", "Bouaud J", "Seroussi B"],
        "journal": "Studies in Health Technology and Informatics",
        "year": 2024,
        "abstract": "The healthcare sector confronts challenges from overloaded tumor board meetings, reduced discussion durations, and care quality concerns, necessitating innovative solutions. Integrating Clinical Decision Support Systems powered by LLMs may address these challenges. This scoping review examines both measured performance and healthcare professional perception of LLM-based CDSS.",
        "url": "https://doi.org/10.3233/SHTI240543",
        "pmid": "39176924",
        "source": "pubmed",
        "keywords": ["ChatGPT", "clinical decision support systems", "large language models", "tumor board", "perception"],
        "citationCount": None,
        "fullTextAvailable": False
    },
    {
        "id": "pmid_39974299",
        "title": "DeepSeek in Healthcare: Revealing Opportunities and Steering Challenges of a New Open-Source Artificial Intelligence Frontier",
        "authors": ["Temsah A", "Alhasan K", "Altamimi I", "Jamal A", "Al-Eyadhy A", "Malki KH", "Temsah MH"],
        "journal": "Cureus",
        "year": 2025,
        "abstract": "Generative AI has driven several advancements in healthcare, with LLMs such as ChatGPT, Gemini, and Copilot demonstrating capabilities. DeepSeek represents a new open-source frontier that enables offline AI deployment for healthcare, addressing data privacy concerns. Key challenges include AI hallucinations, bias in medicine, and HIPAA/GDPR compliance.",
        "url": "https://doi.org/10.7759/cureus.79221",
        "pmid": "39974299",
        "source": "pubmed",
        "keywords": ["DeepSeek", "open-source AI", "healthcare", "data privacy", "HIPAA", "GDPR", "AI hallucinations"],
        "citationCount": None,
        "fullTextAvailable": True
    }
]

# ============================================================
# Build the JS file
# ============================================================

def to_js_string(s):
    """Escape for JS string."""
    return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "")

def paper_to_js(p, indent="    "):
    lines = []
    lines.append(f"{indent}{{")
    lines.append(f'{indent}  id: "{p["id"]}",')
    lines.append(f"{indent}  title: '{to_js_string(p['title'])}',")
    authors_js = json.dumps(p["authors"])
    lines.append(f"{indent}  authors: {authors_js},")
    lines.append(f"{indent}  journal: '{to_js_string(p['journal'])}',")
    lines.append(f"{indent}  year: {p['year']},")
    lines.append(f"{indent}  abstract: '{to_js_string(p['abstract'])}',")
    lines.append(f'{indent}  url: "{p["url"]}",')
    pmid = f'"{p["pmid"]}"' if p["pmid"] else "null"
    lines.append(f"{indent}  pmid: {pmid},")
    lines.append(f'{indent}  source: "{p["source"]}",')
    kw_js = json.dumps(p["keywords"])
    lines.append(f"{indent}  keywords: {kw_js},")
    cc = p["citationCount"]
    lines.append(f"{indent}  citationCount: {cc if cc else 'null'},")
    lines.append(f"{indent}  fullTextAvailable: {'true' if p['fullTextAvailable'] else 'false'}")
    lines.append(f"{indent}}}")
    return "\n".join(lines)

js_output = """// ============================================================
// sampleData.js — Pre-fetched research papers for demo fallback
// Generated from PubMed and Consensus searches (April 2026)
// ============================================================
// This file provides fallback data when MCP is unavailable.
// Each specialty contains real papers in the shared Paper schema.
// ============================================================

window.SampleData = {
  specialties: [
    "AI in Surgical Outcomes",
    "AI in Radiology & Diagnostic Imaging",
    "LLMs in Clinical Decision Support"
  ],

  // Returns papers for a given specialty query
  getPapers: function(query) {
    const q = query.toLowerCase();
    if (q.includes("surg") || q.includes("operative") || q.includes("transplant")) {
      return this.data["surgery"];
    } else if (q.includes("radiol") || q.includes("imaging") || q.includes("diagnostic")) {
      return this.data["radiology"];
    } else if (q.includes("llm") || q.includes("language model") || q.includes("chatgpt") || q.includes("decision support")) {
      return this.data["llm"];
    }
    // Default: return all papers combined
    return [
      ...this.data["surgery"],
      ...this.data["radiology"],
      ...this.data["llm"]
    ];
  },

  data: {
    "surgery": [
"""

# Add surgery papers
surgery_entries = []
for p in surgery_papers:
    surgery_entries.append(paper_to_js(p, "      "))
js_output += ",\n".join(surgery_entries)

js_output += """
    ],

    "radiology": [
"""

# Add radiology papers
rad_entries = []
for p in radiology_papers:
    rad_entries.append(paper_to_js(p, "      "))
js_output += ",\n".join(rad_entries)

js_output += """
    ],

    "llm": [
"""

# Add LLM papers
llm_entries = []
for p in llm_papers:
    llm_entries.append(paper_to_js(p, "      "))
js_output += ",\n".join(llm_entries)

js_output += """
    ]
  }
};
"""

# Write the file
output_path = r"C:\Users\dbous\code\Projects\research-gap-finder\data\sampleData.js"
with open(output_path, "w", encoding="utf-8") as f:
    f.write(js_output)

# Stats
total = len(surgery_papers) + len(radiology_papers) + len(llm_papers)
print(f"Generated sampleData.js with {total} papers:")
print(f"  - Surgery: {len(surgery_papers)}")
print(f"  - Radiology: {len(radiology_papers)}")
print(f"  - LLMs: {len(llm_papers)}")
print(f"  - File size: {len(js_output):,} bytes")
