package com.berlioz.samples.controllers;

import com.berlioz.samples.entities.NewEntryResponse;
import com.berlioz.samples.entities.PhoneEntry;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
public class NewContactController {

//    @Autowired
//    @Qualifier("app")
//    RestTemplate restTemplate;

    @RequestMapping(name = "/new-contact", method = RequestMethod.POST, produces = "application/json")
    public NewEntryResponse post(PhoneEntry body) {
        return new NewEntryResponse(null);
//        return new NewEntryResponse("THERE WAS ERROR ADDING " + body.getName());
    }

}