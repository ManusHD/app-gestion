import { Directive, OnDestroy, TemplateRef, ViewContainerRef, Input } from "@angular/core";
import { Subscription } from "rxjs";
import { RoleService } from "../services/role.service";


@Directive({
  selector: '[appHasRole]',
})
export class HasRoleDirective implements OnDestroy {
  private subscription: Subscription = new Subscription();
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private roleService: RoleService
  ) {}

  @Input() set appHasRole(role: string) {
    // Limpiar suscripción anterior si existe
    this.subscription.unsubscribe();
    this.subscription = new Subscription();

    // Suscribirse al observable de roles
    this.subscription.add(
      this.roleService.hasRole(role).subscribe((hasRole) => {
        if (hasRole && !this.hasView) {
          // Si tiene el rol y el elemento no se muestra, mostrarlo
          this.viewContainer.createEmbeddedView(this.templateRef);
          this.hasView = true;
        } else if (!hasRole && this.hasView) {
          // Si no tiene el rol y el elemento se muestra, ocultarlo
          this.viewContainer.clear();
          this.hasView = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}