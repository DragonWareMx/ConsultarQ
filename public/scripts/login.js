jQuery('document').ready(function($){
    var loginBtn=$('.btn_login'),
        containerLogin=$('.containerLogin'),
        whiteLogin=$('.containerWhite'),
        blueLogin=$('.containerBlue'),
        containerFooter=$('.containerFooter'),
        info=$('.containerInfo');
        form=$('.formulario');

    loginBtn.click(function(){
        containerLogin.addClass('containerLogin_closed');
        whiteLogin.addClass('containerWhite_closed');
        blueLogin.addClass('containerBlue_closed');
        info.addClass('containerInfo_closed');
        containerFooter.addClass('containerFooter_closed');
        setTimeout(function(){
            form.submit();
          }, 300);
    });
});