package com.berlioz.samples.entities;

public class NewEntryResponse {
    String error;

    public NewEntryResponse()
    {

    }

    public NewEntryResponse(String error)
    {
        this.error = error;
    }

    public String getError() {
        return error;
    }
}
