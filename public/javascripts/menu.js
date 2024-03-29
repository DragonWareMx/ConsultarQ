var ancho;
jQuery('document').ready(function($){
    var menuBtn=$('.main_icon'),
        left=$('.left_main'),
        top=$('.header_main'),
        footer=$('.footer_content'),
        container=$('.main_container'),
        dropdown=$('.categories_dropdown');
    ancho=$(window).width();
    if(ancho<800){
        left.addClass('hide');
        top.addClass('hide');
        footer.addClass('hide');
        dropdown.addClass('hide');
        container.addClass('hide');
    }
    menuBtn.click(function(){
        if(ancho>=800){
            if(left.hasClass('hide')){
                left.removeClass('hide');
                top.removeClass('hide');
                footer.removeClass('hide');
                dropdown.removeClass('hide');
                container.removeClass('hide');
            }
            else{
                left.addClass('hide');
                top.addClass('hide');
                footer.addClass('hide');
                dropdown.addClass('hide');
                container.addClass('hide');
            }
        }
        else{
            if(left.hasClass('mobile')){
                left.removeClass('mobile');
                top.removeClass('mobile');
                footer.removeClass('mobile');
                dropdown.removeClass('mobile');
                container.removeClass('mobile');
            }
            else{
                left.addClass('mobile');
                top.addClass('mobile');
                footer.addClass('mobile');
                dropdown.addClass('mobile');
                container.addClass('mobile');
            }
        }
    });
    $(window).resize(function(){
        var ancho=$(window).width();
        if(ancho<800){
            left.addClass('hide');
            top.addClass('hide');
            footer.addClass('hide');
            dropdown.addClass('hide');
            container.addClass('hide');

            left.removeClass('mobile');
            top.removeClass('mobile');
            footer.removeClass('mobile');
            dropdown.removeClass('mobile');
            container.removeClass('mobile');
        }
        else{
            left.removeClass('hide');
            top.removeClass('hide');
            footer.removeClass('hide');
            dropdown.removeClass('hide');
            container.removeClass('hide');

            left.removeClass('mobile');
            top.removeClass('mobile');
            footer.removeClass('mobile');
            dropdown.removeClass('mobile');
            container.removeClass('mobile');
        }
        ancho=$(window).width();
        menuBtn.unbind('click');
        menuBtn.click(function(){
            if(ancho>=800){
                if(left.hasClass('hide')){
                    left.removeClass('hide');
                    top.removeClass('hide');
                    footer.removeClass('hide');
                    dropdown.removeClass('hide');
                    container.removeClass('hide');
                }
                else{
                    left.addClass('hide');
                    top.addClass('hide');
                    footer.addClass('hide');
                    dropdown.addClass('hide');
                    container.addClass('hide');
                }
            }
            else{
                if(left.hasClass('mobile')){
                    left.removeClass('mobile');
                    top.removeClass('mobile');
                    footer.removeClass('mobile');
                    dropdown.removeClass('mobile');
                    container.removeClass('mobile');
                }
                else{
                    left.addClass('mobile');
                    top.addClass('mobile');
                    footer.addClass('mobile');
                    dropdown.addClass('mobile');
                    container.addClass('mobile');
                }
            }
        });
    });
});