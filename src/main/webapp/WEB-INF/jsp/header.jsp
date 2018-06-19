<%@ page language="java" %>
<%@ page pageEncoding="UTF-8"%>

<%@ page import="org.springframework.web.context.support.WebApplicationContextUtils" %>
<%@ page import="org.springframework.context.ApplicationContext" %>
<%@ page import="org.springframework.web.servlet.support.RequestContextUtils" %>
<%@ page import="org.georchestra.commons.configuration.GeorchestraConfiguration" %>

<%

String headerHeight = "90";
String headerUrl = "/header/";

try {
  ApplicationContext ctx = RequestContextUtils.getWebApplicationContext(request);
  GeorchestraConfiguration georConfig = (GeorchestraConfiguration) ctx.getBean(GeorchestraConfiguration.class);
  if (georConfig.activated()) {
    headerHeight = georConfig.getProperty("headerHeight");
    headerUrl = georConfig.getProperty("headerUrl");
  }
} catch (Exception e) {
  // Ignoring and keeping the default configuration
}

%>

    <script type="text/javascript">
        var headerHeight = <%= headerHeight %>;
    </script>

<c:choose>
    <c:when test='<%= request.getParameter("noheader") == null %>'>
    <div id="go_head">
        <iframe src="<%= headerUrl %>?lang=<%= lang %>&active=mapfishapp" style="width:100%;height:<%= headerHeight %>px;border:none;overflow:hidden;" scrolling="no" frameborder="0"></iframe>
    </div>
    </c:when>
</c:choose>
