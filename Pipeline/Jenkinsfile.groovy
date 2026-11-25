pipeline {
    agent none

    options {
        skipDefaultCheckout() // no automatic checkout per stage; the test stage checks out once
    }

    environment {
        CI = 'true'
    }

    stages {

        stage('Prepare Workspace') {
            agent any
            steps {
                echo 'Cleaning workspace before starting Docker'
                cleanWs()
            }
        }

        stage('Run Playwright Tests') {
            agent {
                docker {
                    // Tag must match the exact @playwright/test version pinned in package.json
                    image 'mcr.microsoft.com/playwright:v1.64.1-noble'
                    args '--shm-size=2gb -u root'
                }
            }

            options {
                timeout(time: 45, unit: 'MINUTES')
            }

            steps {
                echo 'Running Demo Web Shop API + UI + Integration suites inside Docker'
                checkout scm

                sh 'npm ci'

                script {
                    // Each layer runs on its own so one red layer does not hide the others' results.
                    def apiStatus = sh(script: 'npx playwright test --project=api', returnStatus: true)
                    def uiStatus = sh(script: 'npx playwright test --project=ui', returnStatus: true)
                    def integrationStatus = sh(script: 'npx playwright test --project=integration', returnStatus: true)

                    if (apiStatus != 0 || uiStatus != 0 || integrationStatus != 0) {
                        currentBuild.result = 'UNSTABLE'
                        echo 'One or more test layers failed. Marking build as UNSTABLE.'
                    }
                }
            }

            post {
                always {
                    archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
                    // The container runs as root (-u root), so every file it wrote is owned by root. Without this,
                    // the NEXT build's cleanWs() (which runs as the "jenkins" user) can't delete them and fails.
                    sh 'chmod -R a+rwX . || true'
                }
            }
        }
    }
}
