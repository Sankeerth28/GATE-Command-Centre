export const SEED_SYLLABUS = [
  {
    "code": "PROB_STAT",
    "name": "Probability and Statistics",
    "icon": "BarChart3",
    "color": "#6366F1",
    "exam_weightage": 16.0,
    "baseline_level": "Weak - Requires structured preparation",
    "display_order": 1,
    "chapters": [
      {
        "title": "Probability Theory",
        "display_order": 1,
        "topics": [
          {
            "title": "Counting and Combinatorics",
            "priority": "Medium",
            "difficulty": "Medium",
            "estimated_hours": 4.0,
            "subtopics": [
              "Permutations and Combinations",
              "Pigeonhole Principle",
              "Inclusion-Exclusion Principle"
            ]
          },
          {
            "title": "Axioms of Probability & Conditional Probability",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Sample Space and Probability Axioms",
              "Conditional Probability & Independence",
              "Total Probability Theorem",
              "Bayes' Theorem & Posterior Odds"
            ]
          }
        ]
      },
      {
        "title": "Random Variables & Distributions",
        "display_order": 2,
        "topics": [
          {
            "title": "Discrete Random Variables & Distributions",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 7.0,
            "subtopics": [
              "PMF and CDF of Discrete Variables",
              "Expectation, Variance and Moments",
              "Bernoulli and Binomial Distributions",
              "Poisson and Geometric Distributions"
            ]
          },
          {
            "title": "Continuous Random Variables & Distributions",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 8.0,
            "subtopics": [
              "PDF, CDF and Quartiles",
              "Expectation and Variance of Continuous Variables",
              "Uniform Distribution",
              "Normal (Gaussian) Distribution & Standard Normal",
              "Exponential Distribution & Memoryless Property"
            ]
          },
          {
            "title": "Joint Probability Distributions",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 7.0,
            "subtopics": [
              "Joint, Marginal and Conditional PMF/PDF",
              "Independence of Random Variables",
              "Covariance and Pearson Correlation",
              "Conditional Expectation and Variance"
            ]
          }
        ]
      },
      {
        "title": "Mathematical Statistics & Inference",
        "display_order": 3,
        "topics": [
          {
            "title": "Limit Theorems & Inequalities",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Markov and Chebyshev's Inequalities",
              "Weak and Strong Law of Large Numbers",
              "Central Limit Theorem (CLT)"
            ]
          },
          {
            "title": "Statistical Estimation & Inference",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 6.0,
            "subtopics": [
              "Point Estimation & Unbiasedness",
              "Maximum Likelihood Estimation (MLE)",
              "Confidence Intervals for Means and Proportions"
            ]
          },
          {
            "title": "Hypothesis Testing",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 6.0,
            "subtopics": [
              "Null & Alternative Hypotheses, Type I & II Errors",
              "Significance Levels and p-values",
              "z-Test and One/Two-Sample t-Test",
              "Chi-Square Goodness-of-Fit and Independence Test"
            ]
          }
        ]
      }
    ]
  },
  {
    "code": "LIN_ALG",
    "name": "Linear Algebra",
    "icon": "Grid",
    "color": "#38BDF8",
    "exam_weightage": 14.0,
    "baseline_level": "Intermediate - Previously studied; requires revision & PYQs",
    "display_order": 2,
    "chapters": [
      {
        "title": "Vector Spaces & Linear Systems",
        "display_order": 1,
        "topics": [
          {
            "title": "Vector Spaces and Subspaces",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 6.0,
            "subtopics": [
              "Vector Spaces Definition and Properties",
              "Subspaces and Linear Combinations",
              "Linear Independence and Span",
              "Basis, Dimension and Coordinate Systems"
            ]
          },
          {
            "title": "Matrices & Systems of Linear Equations",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 6.0,
            "subtopics": [
              "Elementary Row Operations & Row Echelon Form",
              "Gaussian Elimination and Gauss-Jordan",
              "Rank, Nullity and Rank-Nullity Theorem",
              "Consistency & Solutions of Linear Systems"
            ]
          }
        ]
      },
      {
        "title": "Transformations, Eigenvalues & Factorizations",
        "display_order": 2,
        "topics": [
          {
            "title": "Linear Transformations & Matrix Representations",
            "priority": "Medium",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Kernel and Range of Linear Transformations",
              "Matrix Representations of Transformations",
              "Change of Basis and Invertible Transformations"
            ]
          },
          {
            "title": "Eigenvalues, Eigenvectors & Diagonalization",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 7.0,
            "subtopics": [
              "Characteristic Polynomial and Roots",
              "Algebraic and Geometric Multiplicity",
              "Diagonalization and Spectral Theorem for Symmetric Matrices",
              "Trace, Determinant and Powers of Matrices"
            ]
          },
          {
            "title": "Orthogonality & Projections",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 6.0,
            "subtopics": [
              "Inner Products and Norms",
              "Cauchy-Schwarz Inequality",
              "Orthogonal and Orthonormal Sets",
              "Gram-Schmidt Orthogonalization Process",
              "Orthogonal Projections and Least Squares"
            ]
          },
          {
            "title": "Advanced Factorizations & SVD",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 7.0,
            "subtopics": [
              "Singular Value Decomposition (SVD)",
              "Singular Values, Left/Right Singular Vectors",
              "Low-Rank Approximations and PCA Connection",
              "LU and Cholesky Decompositions"
            ]
          }
        ]
      }
    ]
  },
  {
    "code": "CALC_OPT",
    "name": "Calculus and Optimization",
    "icon": "Activity",
    "color": "#F59E0B",
    "exam_weightage": 12.0,
    "baseline_level": "Weak - Requires foundational learning and practice",
    "display_order": 3,
    "chapters": [
      {
        "title": "Single Variable Calculus",
        "display_order": 1,
        "topics": [
          {
            "title": "Limits, Continuity and Differentiability",
            "priority": "Medium",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Limits and Indeterminate Forms (L'Hopital's Rule)",
              "Continuity and Discontinuity Types",
              "Differentiability and Derivative Rules",
              "Rolle's and Mean Value Theorems"
            ]
          },
          {
            "title": "Taylor Series & Local Approximations",
            "priority": "Medium",
            "difficulty": "Medium",
            "estimated_hours": 4.0,
            "subtopics": [
              "Taylor and Maclaurin Series",
              "Linear and Quadratic Approximations",
              "Error Bounds and Truncation"
            ]
          },
          {
            "title": "Maxima and Minima of Single Variable",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Critical Points and Local/Global Extrema",
              "First and Second Derivative Tests",
              "Concavity and Points of Inflection"
            ]
          }
        ]
      },
      {
        "title": "Multivariable Calculus",
        "display_order": 2,
        "topics": [
          {
            "title": "Partial Derivatives, Gradients & Hessian",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 6.0,
            "subtopics": [
              "Partial Derivatives and Multivariable Chain Rule",
              "Directional Derivatives and Gradient Vector",
              "Tangent Planes and Linear Approximations",
              "Hessian Matrix and Second Order Derivatives"
            ]
          }
        ]
      },
      {
        "title": "Mathematical Optimization",
        "display_order": 3,
        "topics": [
          {
            "title": "Unconstrained Optimization & Gradient Descent",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 7.0,
            "subtopics": [
              "Convex Sets and Convex Functions",
              "First and Second Order Optimality Conditions",
              "Gradient Descent and Step Size",
              "Stochastic and Batch Gradient Descent"
            ]
          },
          {
            "title": "Constrained Optimization & Lagrange Multipliers",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 7.0,
            "subtopics": [
              "Equality Constraints and Lagrange Multipliers",
              "Inequality Constraints and KKT Conditions",
              "Primal and Dual Formulations"
            ]
          }
        ]
      }
    ]
  },
  {
    "code": "PROG_DSA",
    "name": "Programming, Data Structures & Algorithms",
    "icon": "Code2",
    "color": "#10B981",
    "exam_weightage": 16.0,
    "baseline_level": "Intermediate",
    "display_order": 4,
    "chapters": [
      {
        "title": "Python Programming",
        "display_order": 1,
        "topics": [
          {
            "title": "Python Programming Fundamentals",
            "priority": "Medium",
            "difficulty": "Easy",
            "estimated_hours": 6.0,
            "subtopics": [
              "Data Types, Operators and Flow Control",
              "Lists, Tuples, Dictionaries, Sets and Comprehensions",
              "Functions, Arguments, Scope and Recursion",
              "OOP Concepts: Classes, Objects, Inheritance"
            ]
          }
        ]
      },
      {
        "title": "Data Structures",
        "display_order": 2,
        "topics": [
          {
            "title": "Linear Data Structures",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Arrays and Dynamic Arrays",
              "Singly and Doubly Linked Lists",
              "Stacks, Queues and Deques",
              "Stack and Queue Applications"
            ]
          },
          {
            "title": "Trees & Binary Search Trees",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 7.0,
            "subtopics": [
              "Tree Traversals (Inorder, Preorder, Postorder, Level)",
              "Binary Search Tree (BST) Operations",
              "Balanced Trees Concept (AVL, Red-Black)",
              "Tree Height, Depth and Diameter"
            ]
          },
          {
            "title": "Heaps and Priority Queues",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 4.0,
            "subtopics": [
              "Binary Heap Representation (Min/Max Heap)",
              "Heapify and Build Heap Operations",
              "Heap Sort Algorithm",
              "Priority Queue Implementation"
            ]
          },
          {
            "title": "Hashing and Graph Representations",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Hash Functions and Collision Resolution",
              "Chaining vs Open Addressing",
              "Graph Representations (Adjacency Matrix & List)"
            ]
          }
        ]
      },
      {
        "title": "Algorithms & Complexity",
        "display_order": 3,
        "topics": [
          {
            "title": "Asymptotic Analysis & Sorting/Searching",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Asymptotic Notations (Big O, Omega, Theta)",
              "Solving Recurrence Relations (Master Theorem)",
              "Linear and Binary Search",
              "Merge Sort, Quick Sort and Comparative Analysis"
            ]
          },
          {
            "title": "Algorithmic Paradigms",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 8.0,
            "subtopics": [
              "Divide and Conquer Strategy",
              "Greedy Method and Optimal Substructure",
              "Dynamic Programming (Memoization & Tabulation)",
              "Classic DP: LCS, 0/1 Knapsack, Matrix Chain Multiplication"
            ]
          },
          {
            "title": "Graph Traversal & Shortest Paths",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 7.0,
            "subtopics": [
              "Breadth-First Search (BFS) and Applications",
              "Depth-First Search (DFS) and Topological Sort",
              "Dijkstra's Shortest Path Algorithm",
              "Bellman-Ford Algorithm",
              "Minimum Spanning Trees (Prim's & Kruskal's)"
            ]
          }
        ]
      }
    ]
  },
  {
    "code": "DBMS_DWH",
    "name": "Database Management & Data Warehousing",
    "icon": "Database",
    "color": "#EC4899",
    "exam_weightage": 12.0,
    "baseline_level": "Weak - Requires structured concept preparation",
    "display_order": 5,
    "chapters": [
      {
        "title": "Database Design & Relational Models",
        "display_order": 1,
        "topics": [
          {
            "title": "ER Modeling & Relational Model",
            "priority": "Medium",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Entity-Relationship (ER) Concepts",
              "ER-to-Relational Schema Mapping",
              "Integrity Constraints and Candidate/Foreign Keys"
            ]
          },
          {
            "title": "Relational Algebra & Tuple Calculus",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 5.0,
            "subtopics": [
              "Fundamental Relational Algebra Operators",
              "Joins: Theta, Natural, Outer Joins",
              "Tuple Relational Calculus (TRC)",
              "Domain Relational Calculus (DRC)"
            ]
          }
        ]
      },
      {
        "title": "SQL & Normalization",
        "display_order": 2,
        "topics": [
          {
            "title": "Structured Query Language (SQL)",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 7.0,
            "subtopics": [
              "DDL, DML, DCL Statements",
              "Complex Queries, Multi-table Joins",
              "Subqueries, Correlated Subqueries, Exists",
              "Aggregation, Group By, Having, Window Functions"
            ]
          },
          {
            "title": "Functional Dependencies & Normalization",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 6.0,
            "subtopics": [
              "Functional Dependencies and Attribute Closure",
              "Minimal Cover and Candidate Key Finding",
              "1NF, 2NF, 3NF and BCNF",
              "Lossless Join and Dependency Preserving Decompositions"
            ]
          }
        ]
      },
      {
        "title": "Transactions, Indexing & Data Warehousing",
        "display_order": 3,
        "topics": [
          {
            "title": "Transactions & Concurrency Control",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 6.0,
            "subtopics": [
              "ACID Properties",
              "Conflict and View Serializability",
              "Recoverable and Cascadeless Schedules",
              "Two-Phase Locking Protocol (2PL) and Deadlocks"
            ]
          },
          {
            "title": "File Organization & B/B+ Trees Indexing",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 5.0,
            "subtopics": [
              "Primary, Secondary, and Clustering Indexes",
              "B-Trees Structure and Properties",
              "B+ Trees Insertion, Deletion and Cost Analysis"
            ]
          },
          {
            "title": "Data Warehousing & OLAP",
            "priority": "Medium",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Data Warehouse Architecture and ETL Concepts",
              "Multidimensional Schemas: Star, Snowflake, Galaxy",
              "OLAP Operations: Drill-down, Roll-up, Slice, Dice, Pivot"
            ]
          }
        ]
      }
    ]
  },
  {
    "code": "ML_AI",
    "name": "Machine Learning & Artificial Intelligence",
    "icon": "Cpu",
    "color": "#8B5CF6",
    "exam_weightage": 16.0,
    "baseline_level": "Intermediate - Requires GATE-oriented mathematical practice",
    "display_order": 6,
    "chapters": [
      {
        "title": "Supervised Learning",
        "display_order": 1,
        "topics": [
          {
            "title": "Linear Regression & Regularization",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 6.0,
            "subtopics": [
              "Simple & Multiple Linear Regression",
              "Ordinary Least Squares (OLS) Formulation",
              "Ridge (L2) and Lasso (L1) Regularization",
              "Bias-Variance Tradeoff and Cross-Validation"
            ]
          },
          {
            "title": "Classification & Tree Models",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 8.0,
            "subtopics": [
              "Logistic Regression & Decision Boundaries",
              "Decision Trees: Entropy, Information Gain, Gini",
              "Overfitting and Tree Pruning",
              "Random Forests, Bagging and Gradient Boosting"
            ]
          },
          {
            "title": "k-Nearest Neighbors & Naive Bayes",
            "priority": "Medium",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "k-NN Distance Metrics and Choice of k",
              "Bayes Decision Rule and Maximum a Posteriori (MAP)",
              "Naive Bayes Classifier (Gaussian & Multinomial)"
            ]
          },
          {
            "title": "Support Vector Machines (SVM)",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 6.0,
            "subtopics": [
              "Maximal Margin Hyperplane and Support Vectors",
              "Soft-Margin Formulation and Slack Variables",
              "Kernel Trick (Polynomial, RBF Kernels)"
            ]
          }
        ]
      },
      {
        "title": "Unsupervised Learning & Deep Learning",
        "display_order": 2,
        "topics": [
          {
            "title": "Clustering Algorithms",
            "priority": "Medium",
            "difficulty": "Medium",
            "estimated_hours": 6.0,
            "subtopics": [
              "k-Means and k-Means++ Clustering",
              "Objective Function and Elbow Method",
              "Hierarchical Clustering (Agglomerative, Dendrograms)",
              "DBSCAN Density-Based Clustering"
            ]
          },
          {
            "title": "Dimensionality Reduction & PCA",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 5.0,
            "subtopics": [
              "Curse of Dimensionality",
              "Principal Component Analysis (PCA) Derivation",
              "Covariance Matrix and Eigenvector Projection",
              "Explained Variance and Reconstruction Error"
            ]
          },
          {
            "title": "Multilayer Perceptron & Neural Networks",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 7.0,
            "subtopics": [
              "Perceptron and Linear Separability",
              "Multilayer Perceptron (MLP) Architecture",
              "Activation Functions (Sigmoid, Tanh, ReLU, Softmax)",
              "Loss Functions (MSE, Cross-Entropy)"
            ]
          },
          {
            "title": "Backpropagation & Deep Learning Optimization",
            "priority": "High",
            "difficulty": "Hard",
            "estimated_hours": 7.0,
            "subtopics": [
              "Backpropagation Derivation and Gradient Flow",
              "Optimizers: SGD, Momentum, RMSprop, Adam",
              "Regularization: Dropout, L1/L2, Batch Normalization",
              "Vanishing and Exploding Gradients"
            ]
          }
        ]
      },
      {
        "title": "Artificial Intelligence & Search",
        "display_order": 3,
        "topics": [
          {
            "title": "Search Algorithms & Heuristics",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 6.0,
            "subtopics": [
              "State Space, States, Actions, Path Cost",
              "Uninformed Search: BFS, DFS, Uniform Cost Search",
              "Informed Search: A* Search, Heuristic Admissibility",
              "Consistency and Optimality of A*"
            ]
          },
          {
            "title": "Adversarial Search & Game Playing",
            "priority": "Medium",
            "difficulty": "Hard",
            "estimated_hours": 5.0,
            "subtopics": [
              "Game Trees and Optimal Decisions",
              "Minimax Algorithm Formulation",
              "Alpha-Beta Pruning Technique and Efficiency"
            ]
          }
        ]
      }
    ]
  },
  {
    "code": "GEN_APT",
    "name": "General Aptitude",
    "icon": "Compass",
    "color": "#06B6D4",
    "exam_weightage": 15.0,
    "baseline_level": "Intermediate - Requires consistent weekly practice",
    "display_order": 7,
    "chapters": [
      {
        "title": "Verbal Aptitude",
        "display_order": 1,
        "topics": [
          {
            "title": "English Grammar & Vocabulary",
            "priority": "Medium",
            "difficulty": "Easy",
            "estimated_hours": 5.0,
            "subtopics": [
              "Tenses, Prepositions, Conjunctions",
              "Subject-Verb Agreement and Articles",
              "Vocabulary, Idioms and Phrasal Verbs"
            ]
          },
          {
            "title": "Reading Comprehension & Critical Reasoning",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 6.0,
            "subtopics": [
              "Passage Analysis and Central Idea",
              "Inference and Logical Deductions",
              "Sentence Completion and Ordering"
            ]
          }
        ]
      },
      {
        "title": "Quantitative Aptitude",
        "display_order": 2,
        "topics": [
          {
            "title": "Numerical Computation & Word Problems",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 7.0,
            "subtopics": [
              "Percentages, Ratios and Proportions",
              "Profit and Loss, Simple and Compound Interest",
              "Time, Speed and Distance; Time and Work",
              "Permutations, Combinations and Elementary Probability"
            ]
          },
          {
            "title": "Data Interpretation & Statistics",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 6.0,
            "subtopics": [
              "Tables and Column Charts",
              "Bar Charts, Pie Charts and Line Graphs",
              "Summary Statistics: Mean, Median, Mode"
            ]
          }
        ]
      },
      {
        "title": "Analytical & Spatial Aptitude",
        "display_order": 3,
        "topics": [
          {
            "title": "Analytical & Logical Reasoning",
            "priority": "High",
            "difficulty": "Medium",
            "estimated_hours": 5.0,
            "subtopics": [
              "Syllogisms and Deductive Logic",
              "Seating Arrangement and Blood Relations",
              "Number and Pattern Series"
            ]
          },
          {
            "title": "Spatial Aptitude",
            "priority": "Medium",
            "difficulty": "Medium",
            "estimated_hours": 4.0,
            "subtopics": [
              "Transformation of 2D and 3D Shapes",
              "Paper Folding, Cutting and Assembly",
              "Patterns, Mirror Images and Rotations"
            ]
          }
        ]
      }
    ]
  }
];
