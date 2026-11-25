// Nightly regression for the Demo Web Shop suite.
//
// Create it as a SECOND Jenkins job (Pipeline from SCM, Script Path = Pipeline/Jenkinsfile.nightly.groovy).
// The schedule and the parameters below are registered in Jenkins the first time this file runs,
// so after creating the job, click "Build Now" once. From then on the button reads "Build with Parameters"
// and the job runs by itself every night.
//
// The nightly (cron) run always uses the DEFAULT parameter values. Change a value only for a manual run,
// or change the default here and push.

pipeline {
    agent none

    triggers {
        // Every night around 02:00 Dhaka time. "H" lets Jenkins pick a fixed minute so jobs don't all start at :00.
        cron('''TZ=Asia/Dhaka
H 2 * * *''')
    }

    parameters {
        choice(
            name: 'TEST_LAYER',
            choices: ['all', 'api', 'ui', 'integration'],
            description: 'Which Playwright project to run. "all" runs api, ui and integration one after another.'
        )
        string(
            name: 'GREP',
            defaultValue: '',
            description: 'Optional: only tests whose title or tag matches, e.g. @smoke or "checkout". Empty = every test.'
        )
        string(
            name: 'BASE_URL',
            defaultValue: 'https://demowebshop.tricentis.com/',
            description: 'Site under test. Read by src/config/env.js (same key as in .env).'
        )
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '14')) // keep two weeks of nightly reports; videos make builds large
        disableConcurrentBuilds()                      // a manual run waits if the nightly one is still going
        skipDefaultCheckout()                          // no automatic checkout per stage; the test stage checks out once
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

        stage('Nightly Playwright Run') {
            agent {
                docker {
                    // Tag must match the exact @playwright/test version pinned in package.json
                    image 'mcr.microsoft.com/playwright:v1.64.1-noble'
                    args '--shm-size=2gb -u root'
                }
            }

            options {
                timeout(time: 60, unit: 'MINUTES')
            }

            steps {
                echo "Layer: ${params.TEST_LAYER} | Grep: '${params.GREP}' | Site: ${params.BASE_URL}"
                checkout scm

                sh 'npm ci'

                script {
                    // On the very first build the job doesn't know its parameters yet, so fall back to 'all'.
                    def selectedLayer = params.TEST_LAYER ?: 'all'
                    def layers = ['api', 'ui', 'integration']
                    if (selectedLayer != 'all') {
                        layers = [selectedLayer]
                    }

                    def failedLayers = []
                    for (layer in layers) {
                        // Parameters reach the shell as environment variables. Using "$GREP" inside a
                        // single-quoted Groovy string lets the SHELL expand it, so a value with quotes or
                        // spaces can't break (or inject into) the command.
                        // --pass-with-no-tests: a GREP that matches nothing in one layer is not a failure.
                        withEnv(["LAYER=${layer}"]) {
                            def status = sh(
                                script: 'npx playwright test --project="$LAYER" --pass-with-no-tests ${GREP:+--grep "$GREP"}',
                                returnStatus: true
                            )
                            if (status != 0) {
                                failedLayers.add(layer)
                            }
                        }
                    }

                    if (failedLayers) {
                        currentBuild.result = 'UNSTABLE'
                        currentBuild.description = "Failed: ${failedLayers.join(', ')}"
                        echo "Failed layers: ${failedLayers.join(', ')}. Marking build as UNSTABLE."
                    } else {
                        currentBuild.description = "Passed: ${layers.join(', ')}"
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
