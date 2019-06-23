package com.berlioz.samples.entities;

public class PhoneEntry {
    String name;
    String phone;

    public PhoneEntry()
    {

    }

    public PhoneEntry(String name, String phone)
    {
        this.name = name;
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }
}
