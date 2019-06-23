package com.berlioz.samples.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.berlioz.samples.entities.PhoneEntry;

@Controller
public class IndexController {

    @RequestMapping("/")
    public String index(Map<String, Object> model) {

        try 
        {
            // PhoneEntry[] entries = restTemplate
            //         .getForObject("/entries", PhoneEntry[].class);

            List<PhoneEntry> entries = new ArrayList<PhoneEntry>();
            entries.add(new PhoneEntry("ruben", "12345"));
            model.put("entries", entries);
        }
        catch(Exception ex)
        {
            model.put("error", "Error from app: " + ex.getMessage());
        }

        return "index";
    }

}