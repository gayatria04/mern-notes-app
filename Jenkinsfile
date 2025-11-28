pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: docker
    image: docker:24.0
    command: ['cat']
    tty: true
    volumeMounts:
    - name: docker-socket
      mountPath: /var/run/docker.sock
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ['cat']
    tty: true
  - name: jnlp
    image: jenkins/inbound-agent:3345.v03dee9b_f88fc-1
    args: ['\$(JENKINS_SECRET)', '\$(JENKINS_NAME)']
    volumeMounts:
    - name: workspace-volume
      mountPath: /home/jenkins/agent
  volumes:
  - name: docker-socket
    hostPath:
      path: /var/run/docker.sock
  - name: workspace-volume
    emptyDir: {}
'''
        }
    }

    environment {
        NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"
        IMAGE_NAME = "notes-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/gayatria04/mern-notes-app'
            }
        }

        stage('Fix Import Paths') {
            steps {
                container('docker') {
                    sh '''
                        echo "=== Current File Structure ==="
                        ls -la src/
                        
                        echo "=== Fixing Import Paths in App.jsx ==="
                        # Fix the import paths to point to current directory instead of ./components/
                        sed -i 's|from "./components/NoteForm.jsx"|from "./NoteForm.jsx"|g' src/App.jsx
                        sed -i 's|from "./components/Note.jsx"|from "./Note.jsx"|g' src/App.jsx
                        
                        echo "=== Updated Imports ==="
                        grep "import.*from" src/App.jsx
                        
                        echo "=== Verifying Files Exist ==="
                        [ -f "src/NoteForm.jsx" ] && echo "✓ NoteForm.jsx exists" || echo "✗ NoteForm.jsx missing"
                        [ -f "src/Note.jsx" ] && echo "✓ Note.jsx exists" || echo "✗ Note.jsx missing"
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                container('docker') {
                    sh '''
                        echo "Building Docker image..."
                        docker build -t $IMAGE_NAME:latest .
                        echo "Docker images:"
                        docker images | grep $IMAGE_NAME
                    '''
                }
            }
        }

        stage('Login to Docker Registry') {
            steps {
                container('docker') {
                    withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                        sh '''
                            echo "Logging into Docker registry..."
                            docker login $NEXUS_DOCKER_REPO -u $NEXUS_USER -p $NEXUS_PASS
                        '''
                    }
                }
            }
        }

        stage('Tag and Push Image') {
            steps {
                container('docker') {
                    script {
                        def tag = "${env.BUILD_NUMBER}"
                        sh """
                            echo "Tagging and pushing image..."
                            docker tag $IMAGE_NAME:latest $NEXUS_DOCKER_REPO/$IMAGE_NAME:\$tag
                            docker tag $IMAGE_NAME:latest $NEXUS_DOCKER_REPO/$IMAGE_NAME:latest
                            docker push $NEXUS_DOCKER_REPO/$IMAGE_NAME:\$tag
                            docker push $NEXUS_DOCKER_REPO/$IMAGE_NAME:latest
                            echo "✅ Image pushed successfully!"
                        """
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                        echo "Deploying to Kubernetes..."
                        kubectl apply -f k8s/deployment.yaml || echo "Deployment applied"
                        kubectl apply -f k8s/service.yaml || echo "Service applied"
                        
                        # Update deployment with new image
                        kubectl set image deployment/notes-frontend notes-frontend=$NEXUS_DOCKER_REPO/$IMAGE_NAME:${env.BUILD_NUMBER} --record=true
                        
                        # Wait for rollout to complete
                        kubectl rollout status deployment/notes-frontend --timeout=300s
                        
                        echo "✅ Deployment status:"
                        kubectl get deployment/notes-frontend
                        echo ""
                        echo "✅ Pods status:"
                        kubectl get pods -l app=notes-frontend
                    """
                }
            }
        }
    }

    post {
        success { 
            echo "🎉 Pipeline Successful!" 
            echo "✅ React app built successfully"
            echo "✅ Docker image pushed to registry"
            echo "✅ Application deployed to Kubernetes"
        }
        failure { 
            echo "❌ Pipeline Failed!" 
        }
    }
}


// pipeline {
//     agent {
//         kubernetes {
//             yaml '''
// apiVersion: v1
// kind: Pod
// spec:
//   containers:
//   - name: sonar-scanner
//     image: sonarsource/sonar-scanner-cli
//     command: ['cat']
//     tty: true
//   - name: kubectl
//     image: bitnami/kubectl:latest
//     command: ['cat']
//     tty: true
//   - name: dind
//     image: docker:dind
//     securityContext:
//       privileged: true
//     env:
//     - name: DOCKER_TLS_CERTDIR
//       value: ""
//     volumeMounts:
//     - name: docker-socket
//       mountPath: /var/run/docker.sock
//   volumes:
//   - name: docker-socket
//     hostPath:
//       path: /var/run/docker.sock
// '''
//         }
//     }

//     environment {
//         NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"
//         IMAGE_NAME = "notes-frontend"
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 git branch: 'main', url: 'https://github.com/gayatria04/mern-notes-app'
//             }
//         }

//         stage('Build Docker Image') {
//             steps {
//                 container('dind') {
//                     sh '''
//                         sleep 20
//                         docker build -t notes-frontend:latest .
//                         docker image ls
//                     '''
//                 }
//             }
//         }

//         stage('Skip SonarQube') {
//             steps {
//                 echo "⚠️ Skipping SonarQube analysis for now"
//             }
//         }

//         stage('Login to Docker Registry') {
//             steps {
//                 container('dind') {
//                     withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
//                         sh '''
//                             docker --version
//                             sleep 10
//                             docker login $NEXUS_DOCKER_REPO -u $NEXUS_USER -p $NEXUS_PASS
//                         '''
//                     }
//                 }
//             }
//         }

//         stage('Build - Tag - Push') {
//             steps {
//                 container('dind') {
//                     sh '''
//                         docker tag notes-frontend:latest $NEXUS_DOCKER_REPO/notes-frontend:v1
//                         docker push $NEXUS_DOCKER_REPO/notes-frontend:v1
//                         docker image ls
//                     '''
//                 }
//             }
//         }

//         stage('Deploy to Kubernetes') {
//             steps {
//                 container('kubectl') {
//                     script {
//                         sh '''
//                             # Update the deployment with the correct image
//                             sed -i "s|image:.*|image: $NEXUS_DOCKER_REPO/notes-frontend:v1|" k8s/deployment.yaml
                            
//                             # Apply the deployment and service
//                             kubectl apply -f k8s/deployment.yaml
//                             kubectl apply -f k8s/service.yaml

//                             # Wait for rollout to complete
//                             kubectl rollout status deployment/notes-frontend --timeout=300s
                            
//                             # Show deployment status
//                             kubectl get deployments,services,pods -l app=notes-frontend
//                         '''
//                     }
//                 }
//             }
//         }
//     }

//     post {
//         success { 
//             echo "🎉 Pipeline Successful!" 
//             echo "Application deployed to Kubernetes"
//         }
//         failure { 
//             echo "❌ Pipeline Failed!" 
//         }
//     }
// }

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
//         SONAR_HOST_URL = 'http://sonarqube-sonarqube.sonarqube:9000'
//         NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"
//         IMAGE_FRONTEND = "notes-frontend"
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 git branch: 'main', url: 'https://github.com/gayatria04/mern-notes-app'
//             }
//         }

//         stage('Verify SonarQube') {
//             steps {
//                 container('sonar-scanner') {
//                     script {
//                         timeout(time: 10, unit: 'MINUTES') {
//                             waitUntil {
//                                 script {
//                                     def result = sh(
//                                         script: 'curl -s --connect-timeout 5 http://sonarqube-sonarqube.sonarqube:9000/api/server/version || echo "NOT_READY"',
//                                         returnStdout: true
//                                     ).trim()
//                                     echo "SonarQube check result: ${result}"
//                                     return result != "NOT_READY"
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }

//         stage('SonarQube Analysis') {
//             steps {
//                 container('sonar-scanner') {
//                     withSonarQubeEnv('my-sonarqube') {
//                         withCredentials([string(credentialsId: 'sonarqube-project-token', variable: 'SONAR_AUTH_TOKEN')]) {
//                             sh """
//                                 sonar-scanner \
//                                   -Dsonar.projectKey=2401004_react_notes_app \
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
