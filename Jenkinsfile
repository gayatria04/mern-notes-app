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
      args: ['\$(JENKINS_SECRET)', '\$(JENKINS_NAME)']

    - name: docker
      image: docker:24.0-dind
      securityContext:
        privileged: true
      command: ['dockerd-entrypoint.sh']
      tty: true
      resources:
        requests:
          memory: "2Gi"
          cpu: "1"
        limits:
          memory: "4Gi"
          cpu: "2"

    - name: sonar-scanner
      image: sonarsource/sonar-scanner-cli:latest
      command: ['cat']
      tty: true
      resources:
        requests:
          memory: "1Gi"
          cpu: "500m"
        limits:
          memory: "2Gi"
          cpu: "1"
"""
        }
    }

    environment {
        SONAR_HOST_URL = 'http://sonarqube.imcc.com'
        NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"
        IMAGE_FRONTEND = "notes-frontend"
        IMAGE_BACKEND = "notes-backend"
        DEPLOY_SERVER = "ubuntu@10.0.0.15"
        DEPLOY_PATH = "/home/ubuntu/notes-app"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/gayatria04/mern-notes-app'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withSonarQubeEnv('my-sonarqube') {
                        withCredentials([string(credentialsId: 'sonarqube-project-token', variable: 'SONAR_AUTH_TOKEN')]) {
                            sh '''
                                sonar-scanner \
                                -Dsonar.projectKey=mern-notes-app \
                                -Dsonar.projectName=mern-notes-app \
                                -Dsonar.sources=. \
                                -Dsonar.host.url=$SONAR_HOST_URL \
                                -Dsonar.login=$SONAR_AUTH_TOKEN
                            '''
                        }
                    }
                }
            }
        }


        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                container('docker') {
                    sh """
                        sleep 15

                        docker build -t ${IMAGE_BACKEND}:latest ./notes-backend

                        docker build --build-arg REACT_APP_BACKEND_URL=http://backend:4000 \
                            -t ${IMAGE_FRONTEND}:latest ./notes-frontend
                    """
                }
            }
        }

        stage('Tag & Push Images to Nexus') {
            steps {
                container('docker') {
                    withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                        sh """
                            docker login ${NEXUS_DOCKER_REPO} -u $NEXUS_USER -p $NEXUS_PASS

                            docker tag ${IMAGE_BACKEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
                            docker tag ${IMAGE_FRONTEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest

                            docker push ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
                            docker push ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                sshagent(['DEPLOY_SERVER_SSH']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER} '
                            cd ${DEPLOY_PATH} &&
                            docker compose pull &&
                            docker compose down &&
                            docker compose up -d
                        '
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up dangling Docker images...'
            container('docker') {
                sh 'docker system prune -f || true'
            }
        }
        success {
            echo 'CI/CD pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs!'
        }
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
//       args: ['\$(JENKINS_SECRET)', '\$(JENKINS_NAME)']

//     - name: scanner
//       image: sonarsource/sonar-scanner-cli:latest
//       command: ['cat']
//       tty: true
//       resources:
//         requests:
//           memory: "1Gi"
//           cpu: "500m"
//         limits:
//           memory: "2Gi"
//           cpu: "1"
// """
//         }
//     }

//     environment {
//         SONARQUBE_SERVER = 'sonarqube'
//         SONAR_HOST_URL = 'http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000'

//         NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"
//         IMAGE_FRONTEND = "notes-frontend"
//         IMAGE_BACKEND = "notes-backend"

//         DEPLOY_SERVER = "ubuntu@10.0.0.15"
//         DEPLOY_PATH = "/home/ubuntu/notes-app"
//     }

//     stages {

//         stage('Checkout') {
//             steps {
//                 git branch: 'main',
//                     url: 'https://github.com/gayatria04/mern-notes-app'
//             }
//         }

//         stage('SonarQube Analysis') {
//             steps {
//                 container('scanner') {
//                     withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
//                         sh """
//                             sonar-scanner \
//                                 -Dsonar.projectKey=2401004_react_notes_app \
//                                 -Dsonar.host.url=${SONAR_HOST_URL} \
//                                 -Dsonar.token=$SONAR_TOKEN \
//                                 -Dproject.settings=sonar-project.properties
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Quality Gate') {
//             steps {
//                 timeout(time: 3, unit: 'MINUTES') {
//                     waitForQualityGate abortPipeline: false
//                 }
//             }
//         }

//         stage('Build Docker Images') {
//             steps {
//                 sh """
//                 docker build -t ${IMAGE_BACKEND}:latest ./notes-backend

//                 docker build --build-arg REACT_APP_BACKEND_URL=http://backend:4000 \
//                     -t ${IMAGE_FRONTEND}:latest ./notes-frontend
//                 """
//             }
//         }

//         stage('Tag & Push Images to Nexus') {
//             steps {
//                 sh """
//                 docker tag ${IMAGE_BACKEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
//                 docker tag ${IMAGE_FRONTEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest

//                 docker login ${NEXUS_DOCKER_REPO} -u admin -p admin123

//                 docker push ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
//                 docker push ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest
//                 """
//             }
//         }

//         stage('Deploy to Server') {
//             steps {
//                 sshagent(['DEPLOY_SERVER_SSH']) {
//                     sh """
//                     ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER} '
//                         cd ${DEPLOY_PATH} &&
//                         docker compose pull &&
//                         docker compose down &&
//                         docker compose up -d
//                     '
//                     """
//                 }
//             }
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
//       args: ['\$(JENKINS_SECRET)', '\$(JENKINS_NAME)']
//     - name: scanner
//       image: sonarsource/sonar-scanner-cli:latest
//       command: ['cat']
//       tty: true
//       resources:
//         requests:
//           memory: "1Gi"
//           cpu: "500m"
//         limits:
//           memory: "2Gi"
//           cpu: "1"
// """
//         }
//     }

//     environment {
//         SONARQUBE_SERVER = 'sonarqube'
//         NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"
//         IMAGE_FRONTEND = "notes-frontend"
//         IMAGE_BACKEND = "notes-backend"
//         DEPLOY_SERVER = "ubuntu@10.0.0.15"
//         DEPLOY_PATH = "/home/ubuntu/notes-app"
//     }

//     stages {

//         stage('Checkout') {
//             steps {
//                 git branch: 'main',
//                     url: 'https://github.com/gayatria04/mern-notes-app'
//             }
//         }

//         stage('SonarQube Analysis') {
//             steps {
//                 container('scanner') {
//                     withSonarQubeEnv("${SONARQUBE_SERVER}") {
//                         sh """
//                         export SONAR_SCANNER_OPTS="-Xmx1024m"
//                         sonar-scanner -Dproject.settings=sonar-project.properties
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Quality Gate') {
//             steps {
//                 timeout(time: 3, unit: 'MINUTES') {
//                     waitForQualityGate abortPipeline: false
//                 }
//             }
//         }

//         stage('Build Docker Images') {
//             steps {
//                 sh """
//                 docker build -t ${IMAGE_BACKEND}:latest ./notes-backend

//                 docker build --build-arg REACT_APP_BACKEND_URL=http://backend:4000 \
//                     -t ${IMAGE_FRONTEND}:latest ./notes-frontend
//                 """
//             }
//         }

//         stage('Tag & Push Images to Nexus') {
//             steps {
//                 sh """
//                 docker tag ${IMAGE_BACKEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
//                 docker tag ${IMAGE_FRONTEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest

//                 docker login ${NEXUS_DOCKER_REPO} -u admin -p admin123

//                 docker push ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
//                 docker push ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest
//                 """
//             }
//         }

//         stage('Deploy to Server') {
//             steps {
//                 sshagent(['DEPLOY_SERVER_SSH']) {
//                     sh """
//                     ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER} '
//                         cd ${DEPLOY_PATH} &&
//                         docker compose pull &&
//                         docker compose down &&
//                         docker compose up -d
//                     '
//                     """
//                 }
//             }
//         }
//     }
// }






// pipeline {
//     agent any

//     environment {

//         // Sonar
//         SONARQUBE_SERVER = 'sonarqube'        
//         SONAR_SCANNER = 'SonarScanner'       

//         // Nexus
//         NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"
//         IMAGE_FRONTEND = "notes-frontend"
//         IMAGE_BACKEND = "notes-backend"

//         // Deployment
//         DEPLOY_SERVER = "ubuntu@10.0.0.15"
//         DEPLOY_PATH = "/home/ubuntu/notes-app"
//     }

//     stages {

//         stage('Checkout') {
//             steps {
//                 git branch: 'main',
//                     url: 'https://github.com/gayatria04/mern-notes-app'
//             }
//         }

//         stage('SonarQube Analysis') {
//             steps {
//                 withSonarQubeEnv("${SONARQUBE_SERVER}") {
//                     script {
//                         def scannerHome = tool "${SONAR_SCANNER}"
//                         sh """
//                             ${scannerHome}/bin/sonar-scanner \
//                             -Dproject.settings=sonar-project.properties
//                         """
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

//         stage('Build Docker Images') {
//             steps {
//                 sh """
//                 docker build -t ${IMAGE_BACKEND}:latest ./notes-backend
//                 docker build -t ${IMAGE_FRONTEND}:latest ./notes-frontend
//                 """
//             }
//         }

//         stage('Tag & Push Images to Nexus') {
//             steps {
//                 sh """
//                 docker tag ${IMAGE_BACKEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
//                 docker tag ${IMAGE_FRONTEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest

//                 docker login ${NEXUS_DOCKER_REPO} -u admin -p admin123

//                 docker push ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
//                 docker push ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest
//                 """
//             }
//         }

//         stage('Deploy To Server') {
//             steps {
//                 sshagent(['DEPLOY_SERVER_SSH']) {
//                     sh """
//                     ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER} '
//                         cd ${DEPLOY_PATH} &&
//                         docker compose pull &&
//                         docker compose down &&
//                         docker compose up -d
//                     '
//                     """
//                 }
//             }
//         }
//     }
// }






// pipeline {
//     agent any

//     environment {
//         // Sonar
//         SONARQUBE_SERVER = 'sonarqube'        // Name configured in Jenkins
//         SONAR_SCANNER = 'SonarScanner'       // Scanner installation name in Jenkins
        
//         // Nexus
//         NEXUS_DOCKER_REPO = "nexus.mycompany.com:8083"   // example
//         IMAGE_FRONTEND = "notes-frontend"
//         IMAGE_BACKEND = "notes-backend"

//         // Deployment
//         DEPLOY_SERVER = "ubuntu@10.0.0.15"      // your server
//         DEPLOY_PATH = "/home/ubuntu/notes-app"  // project location on server
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 git branch: 'main',
//                     url: 'https://github.com/gayatria04/mern-notes-app'
//             }
//         }

//         stage('SonarQube Analysis') {
//             steps {
//                 withSonarQubeEnv("${SONARQUBE_SERVER}") {
//                     script {
//                         def scannerHome = tool "${SONAR_SCANNER}"
//                         sh """
//                             ${scannerHome}/bin/sonar-scanner \
//                             -Dproject.settings=sonar-project.properties
//                         """
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

//         stage('Build Docker Images') {
//             steps {
//                 sh """
//                 docker build -t ${IMAGE_BACKEND}:latest ./notes-backend
//                 docker build -t ${IMAGE_FRONTEND}:latest ./notes-frontend
//                 """
//             }
//         }

//         stage('Tag & Push Images to Nexus') {
//             steps {
//                 sh """
//                 docker tag ${IMAGE_BACKEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
//                 docker tag ${IMAGE_FRONTEND}:latest ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest

//                 docker login ${NEXUS_DOCKER_REPO} -u admin -p admin123

//                 docker push ${NEXUS_DOCKER_REPO}/${IMAGE_BACKEND}:latest
//                 docker push ${NEXUS_DOCKER_REPO}/${IMAGE_FRONTEND}:latest
//                 """
//             }
//         }

//         stage('Deploy to Server') {
//             steps {
//                 sshagent (['DEPLOY_SERVER_SSH']) {
//                     sh """
//                     ssh -o StrictHostKeyChecking=no ${DEPLOY_SERVER} '
//                         cd ${DEPLOY_PATH} &&
//                         docker compose pull &&
//                         docker compose down &&
//                         docker compose up -d
//                     '
//                     """
//                 }
//             }
//         }
//     }
// }
