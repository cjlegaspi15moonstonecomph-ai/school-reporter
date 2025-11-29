package com.yourproject.models;

public class Report {
    public String studentName;
    public String section;
    public String incidentType;
    public String description;

    public Report(String studentName, String section, String incidentType, String description) {
        this.studentName = studentName;
        this.section = section;
        this.incidentType = incidentType;
        this.description = description;
    }
}
