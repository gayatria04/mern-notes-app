pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: jnlp
      image: jenkins/inbound-agent
    - name: docker
      image: docker:24.0-dind
      securityContext:
        privileged: true
      tty: true
      env:
      - name: DOCKER_TLS_CERTDIR
        value: ""
    - name: sonar-scanner
      image: sonarsource/sonar-scanner-cli:latest
      command: ['cat']
      tty: true
"""
        }
    }

    environment {
        SONAR_HOST_URL = 'http://sonarqube.imcc.com/'
        NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"
        IMAGE_FRONTEND = "notes-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/gayatria04/mern-notes-app'
            }
        }

        stage('Diagnose SonarQube Connectivity') {
            steps {
                container('sonar-scanner') {
                    sh '''
                        echo "Installing diagnostic tools..."
                        apk add --no-cache curl bind-tools
                        
                        echo "Testing DNS resolution..."
                        nslookup sonarqube.imcc.com || echo "External DNS failed"
                        
                        echo "Testing internal Kubernetes services..."
                        nslookup sonarqube || echo "sonarqube service not found"
                        nslookup sonarqube.sonarqube || echo "sonarqube.sonarqube service not found"
                        nslookup sonarqube.default || echo "sonarqube.default service not found"
                        
                        echo "Testing connectivity to possible SonarQube URLs..."
                        for url in "sonarqube:9000" "sonarqube.sonarqube:9000" "sonarqube.default:9000"; do
                            echo "Testing: $url"
                            curl -s --connect-timeout 5 "http://$url/api/server/version" && echo "✅ SUCCESS: $url" || echo "❌ FAILED: $url"
                            echo "---"
                        done
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withSonarQubeEnv('my-sonarqube') {
                        withCredentials([string(credentialsId: 'sonarqube-project-token', variable: 'SONAR_AUTH_TOKEN')]) {
                            sh """
                                sonar-scanner \
                                  -Dsonar.projectKey=2401004_react_notes_app \
                                  -Dsonar.sources=src \
                                  -Dsonar.host.url=$SONAR_HOST_URL \
                                  -Dsonar.login=$SONAR_AUTH_TOKEN
                            """
                        }
                    }
                }
            }
        }

        // ... rest of your stages remain the same
    }
}

// pipeline {
//     agent {
//         kubernetes {
//             yaml """
// apiVersion: v1
// kind: Pod
// spec:
//   containers:
//     - name: jnlp
//       image: jenkins/inbound-agent
//     - name: docker
//       image: docker:24.0-dind
//       securityContext:
//         privileged: true
//       tty: true
//       env:
//       - name: DOCKER_TLS_CERTDIR
//         value: ""
//     - name: sonar-scanner
//       image: sonarsource/sonar-scanner-cli:latest
//       command: ['cat']
//       tty: true
// """
//         }
//     }

//     environment {
//         SONAR_HOST_URL = 'http://sonarqube.imcc.com/'
//         NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"
//         IMAGE_FRONTEND = "notes-frontend"
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 git branch: 'main', url: 'https://github.com/gayatria04/mern-notes-app'
//             }
//         }

//         stage('SonarQube Analysis') {
//             steps {
//                 container('sonar-scanner') {
//                     withSonarQubeEnv('my-sonarqube') {
//                         withCredentials([string(credentialsId: 'sonarqube-project-token', variable: 'SONAR_AUTH_TOKEN')]) {
//                             sh """
//                                 sonar-scanner \
//                                   -Dsonar.projectKey=2401004_react_notes_app\
//                                   -Dsonar.sources=src \
//                                   -Dsonar.host.url=$SONAR_HOST_URL \
//                                   -Dsonar.login=$SONAR_AUTH_TOKEN
//                             """
//                         }
//                     }
//                 }
//             }
//         }

//         stage('Quality Gate') {
//             steps {
//                 timeout(time: 5, unit: 'MINUTES') {
//                     waitForQualityGate abortPipeline: true
//                 }
//             }
//         }

//         stage('Build Docker Image') {
//             steps {
//                 container('docker') {
//                     sh 'docker build -t notes-frontend:latest .'
//                 }
//             }
//         }

//         stage('Push to Nexus') {
//             steps {
//                 container('docker') {
//                     withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
//                         sh """
//                             docker login $NEXUS_DOCKER_REPO -u $NEXUS_USER -p $NEXUS_PASS
//                             docker tag notes-frontend:latest $NEXUS_DOCKER_REPO/notes-frontend:latest
//                             docker push $NEXUS_DOCKER_REPO/notes-frontend:latest
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Deploy to Kubernetes') {
//             steps {
//                 container('docker') {
//                     sh """
//                         kubectl apply -f k8s/deployment.yaml
//                         kubectl apply -f k8s/service.yaml
//                     """
//                 }
//             }
//         }
//     }

//     post {
//         success { echo "🎉 Deploy Successful!" }
//         failure { echo "❌ Pipeline Failed!" }
//     }
// }
