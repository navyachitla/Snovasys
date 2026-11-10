@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM ----------------------------------------------------------------------------

@IF "%DEBUG%" == "" @ECHO OFF
@SETLOCAL EnableExtensions EnableDelayedExpansion

SET "DIRNAME=%~dp0"
IF "%DIRNAME%" == "" SET "DIRNAME=."
IF "%DIRNAME:~-1%" == "\" SET "DIRNAME=%DIRNAME:~0,-1%"

SET "MAVEN_BASEDIR=%DIRNAME%"
SET "MAVEN_PROJECTBASEDIR=%DIRNAME%"

SET "WRAPPER_JAR=%MAVEN_BASEDIR%\.mvn\wrapper\maven-wrapper.jar"
SET "WRAPPER_PROPERTIES=%MAVEN_BASEDIR%\.mvn\wrapper\maven-wrapper.properties"

IF EXIST "%WRAPPER_JAR%" GOTO run

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar', '%WRAPPER_JAR%')}"

:run
"%JAVA_HOME%\bin\java.exe" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
IF ERRORLEVEL 1 EXIT /B %ERRORLEVEL%
