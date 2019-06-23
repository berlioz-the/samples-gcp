<!DOCTYPE html>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<html lang="en">
<head>
<script src='https://code.jquery.com/jquery-3.2.1.min.js' ></script>
<script src='https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js' ></script>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
</head>
<body class="container">
<main>
    <h1>Berlioz GCP Samples</h1>
    <h2>02.K8sAddr.java</h2>

    <div class="row">
        <div class="col-sm">
            <div class="card mustard">
                <div class="card-header">
                    New Contact
                </div>
                <div class="card-body">
                    <form id="newContactForm">
                        <div class="form-group">
                            <label for="name">Name</label>
                            <input type="text" name="name" class="form-control" id="name" placeholder="Enter Name">
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone Number</label>
                            <input type="text" name="phone" class="form-control" id="phone" placeholder="Enter Phone Number">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-success">Create New Contact</button>
                        </div>
                        <div id="msgSubmit" class="form-group"></div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-sm">
            <div class="card purple">
                <div class="card-header">
                    Contact List
                </div>
                <div class="card-body">

                    <table class="table">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            <c:forEach items="${entries}" var="entry">
                                <tr>
                                    <th scope="row">${entry.name}</th>
                                    <td>${entry.phone}</td>
                                </tr>
                            </c:forEach>
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    </div>

    <c:if test="${not empty error}">
        <div class="row">
            <div class="col-sm">
                <h3>${error}</h3>
            </div>
        </div>
    </c:if>

</main>

<script>
$(document).ready(function() {
    $("#newContactForm").submit(function(event){
        event.preventDefault();
        submitForm();
    });
});

function submitForm(){
    var formData = {
        name: $("#name").val(),
        phone: $("#phone").val()
    };

    $.ajax({
        type: "POST",
        url: "/new-contact",
        data: formData,
        success : function(result){
            if (result.error) {
                formError(result.error);
            } else {
                window.location.reload();
            }
        },
        error: function() {
            formError('Request failed');
        }
    });
}

function formError(message){
    $("#msgSubmit").addClass("alert");
    $("#msgSubmit").addClass("alert-danger");
    $("#msgSubmit").empty();
    $("#msgSubmit").append("<strong>Error:</strong> " + message );
}
</script>
<style>
.container {
}

.card {
    margin-top: 15px;
    margin-bottom: 15px;
}

/* .small-card {
    max-width: 400px;
    float: left;
} */

.red {
    background-color: #f4bec3;
}
.red .card-header {
    background-color: #dc3545;
    color: white;
    font-weight: 600;
}
.red .table td, .red .table th {
    border-top: 1px solid #dc3545;
}
.red .table thead th {
    border-bottom: 1px solid #28a745;
}


.blue {
    background-color: #b3d7ff;
}
.blue .card-header {
    background-color: #007bff;
    color: white;
    font-weight: 600;
}
.blue .table td, .blue .table th {
    border-top: 1px solid #007bff;
}
.blue .table thead th {
    border-bottom: 1px solid #28a745;
}


.green {
    background-color: #c1f0cc;
}
.green .card-header {
    background-color: #28a745;
    color: white;
    font-weight: 600;
}
.green .table td, .green .table th {
    border-top: 1px solid #28a745;
}
.green .table thead th {
    border-bottom: 1px solid #28a745;
}


.yellow {
    background-color: #ffecb3;
}
.yellow .card-header {
    background-color: #ffbf00;
    color: white;
    font-weight: 600;
}
.yellow .table td, .yellow .table th {
    border-top: 1px solid #ffbf00;
}
.yellow .table thead th {
    border-bottom: 1px solid #28a745;
}


.dark {
    background-color: #d5d9dd;
}
.dark .card-header {
    background-color: #343a40;
    color: white;
    font-weight: 600;
}
.dark .table td, .dark .table th {
    border-top: 1px solid #343a40;
}
.dark .table thead th {
    border-bottom: 1px solid #28a745;
}


.eastern-blue {
    background-color: #bbeff7;
}
.eastern-blue .card-header {
    background-color: #17a2b8;
    color: white;
    font-weight: 600;
}
.eastern-blue .table td, .eastern-blue .table th {
    border-top: 1px solid #17a2b8;
}
.eastern-blue .table thead th {
    border-bottom: 1px solid #28a745;
}
</style>

</body>
</html>