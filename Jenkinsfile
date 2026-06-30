pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('youssoufmiyad-dockerhub-password')
        SONAR_TOKEN = credentials('camille.lemonnier-sonar-token')
        DOCKER_IMAGE = "${DOCKERHUB_CREDENTIALS_USR}/tasklist-frontend"
        DOCKER_TAG = "${env.BUILD_NUMBER}"
    }

    stages{
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit testResults: 'reports/junit.xml'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube-server-1') {
                    sh 'npx sonar-scanner'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                    docker buildx create --use --name tasklist-builder || true
                    docker buildx build \
                        --tag ${DOCKER_IMAGE}:${DOCKER_TAG} \
                        --tag ${DOCKER_IMAGE}:latest \
                        --sbom=true \
                        --provenance=true \
                        --load \
                        .
                """
            }
        }

        stage('Trivy Scan') {
            steps {
                sh 'mkdir -p reports'
                sh """
                    trivy image \
                        --exit-code 1 \
                        --severity CRITICAL,HIGH \
                        --format table \
                        --output reports/trivy-report.txt \
                        ${DOCKER_IMAGE}:${DOCKER_TAG}

                    trivy image \
                        --format json \
                        --output reports/trivy-report.json \
                        ${DOCKER_IMAGE}:${DOCKER_TAG}

                    trivy image \
                        --format sarif \
                        --output reports/trivy-report.sarif \
                        ${DOCKER_IMAGE}:${DOCKER_TAG}
                """
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/trivy-report.*'
                }
            }
        }

        stage('Generate SBOM') {
            steps {
                sh """
                    trivy image \
                        --format spdx-json \
                        --output reports/sbom-spdx.json \
                        ${DOCKER_IMAGE}:${DOCKER_TAG}

                    trivy image \
                        --format cyclonedx \
                        --output reports/sbom-cyclonedx.json \
                        ${DOCKER_IMAGE}:${DOCKER_TAG}
                """
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/sbom-*'
                }
            }
        }

        stage('Docker Push') {
            steps {
                sh """
                    echo \$DOCKERHUB_CREDENTIALS_PSW | docker login -u \$DOCKERHUB_CREDENTIALS_USR --password-stdin
                    docker buildx build \\
                        --platform linux/amd64 \\
                        --tag ${DOCKER_IMAGE}:${DOCKER_TAG} \\
                        --tag ${DOCKER_IMAGE}:latest \\
                        --sbom=true \\
                        --provenance-true \\
                        --push \\
                        .
                """
            }
            post {
                always {
                    sh 'docker logout'
                }
            }
        }
    }

    post{
        always {
            cleanWs()
        }
        success {
            echo 'frontend pipeline completed successfully!'
        }
        failure {
            echo 'frontend pipeline failed!'
        }
    }
}
